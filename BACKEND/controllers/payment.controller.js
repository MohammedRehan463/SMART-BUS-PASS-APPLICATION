const { validationResult } = require('express-validator');
const Application = require('../models/Application');
const Activity = require('../models/Activity');

// Process payment for an application
exports.processPayment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { paymentMethod, transactionId } = req.body;

  try {
    const application = await Application.findOne({
      _id: req.params.id,
      student: req.user.id,
      status: 'payment_requested'
    });
    
    if (!application) {
      return res.status(404).json({ 
        success: false, 
        message: 'Application not found or payment not requested' 
      });
    }

    // Update payment information
    application.payment.method = paymentMethod;
    application.payment.transactionId = transactionId;
    application.payment.date = Date.now();
    application.payment.status = 'completed';
    // Set status directly to 'completed' and generate pass in one save
    // This avoids race conditions and ensures pass is always available after payment
    // Calculate expiry date (current date + duration months)
    await application.populate('student', 'name email');
    const issueDate = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + application.duration);
    const passNumber = `SBP-${Math.floor(10000 + Math.random() * 90000)}-${new Date().getFullYear()}`;
    const qrData = {
      passNumber,
      studentName: application.student.name || '',
      route: application.route || '',
      validFrom: issueDate,
      validUntil: expiryDate
    };
    application.status = 'completed';
    application.pass = {
      issueDate,
      expiryDate,
      passNumber,
      status: 'active',
      qrData: JSON.stringify(qrData)
    };
    await application.save();
    // Log the activity
    const passActivity = new Activity({
      user: req.user.id,
      application: application._id,
      action: 'PASS_GENERATED',
      details: `Pass generated automatically after payment: ${passNumber}`
    });
    await passActivity.save();
    // Log the payment activity
    const activity = new Activity({
      user: req.user.id,
      application: application._id,
      action: 'PAYMENT_COMPLETED',
      details: `Payment completed using ${paymentMethod}, transaction ID: ${transactionId}`
    });
    await activity.save();
    res.status(200).json({
      success: true,
      message: 'Payment processed successfully and pass generated',
      application
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Get payment status
exports.getPaymentStatus = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ 
        success: false, 
        message: 'Application not found' 
      });
    }

    // Check if user is authorized to view this payment status
    if (req.user.role === 'student' && application.student.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to view this payment status' 
      });
    }

    res.status(200).json({
      success: true,
      payment: application.payment,
      status: application.status
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};