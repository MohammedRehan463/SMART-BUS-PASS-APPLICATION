const Application = require('../models/Application');
const Activity = require('../models/Activity');

// Get all admin approved applications
exports.getAdminApprovedApplications = async (req, res) => {
  try {
    const applications = await Application.find({ status: 'admin_approved' })
      .populate('student', 'name email')
      .populate('adminReview.admin', 'name')
      .sort({ 'adminReview.date': 1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications
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

// Get all payment requested applications
exports.getPaymentRequestedApplications = async (req, res) => {
  try {
    const applications = await Application.find({ 
      status: 'payment_requested',
      'depotReview.officer': req.user.id 
    })
      .populate('student', 'name email')
      .sort({ 'depotReview.date': -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications
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

// Get all completed applications
exports.getCompletedApplications = async (req, res) => {
  try {
    const applications = await Application.find({ 
      status: 'completed',
      'depotReview.officer': req.user.id 
    })
      .populate('student', 'name email')
      .sort({ 'pass.issueDate': -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications
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

// Request payment for an application
exports.requestPayment = async (req, res) => {
  try {
    const { priceCategory, price, notes } = req.body;
    
    if (!priceCategory || !price) {
      return res.status(400).json({ 
        success: false, 
        message: 'Price category and price are required' 
      });
    }

    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ 
        success: false, 
        message: 'Application not found' 
      });
    }

    // Check if application is in admin approved state
    if (application.status !== 'admin_approved') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot request payment for application in current state' 
      });
    }

    // Update application
    application.status = 'payment_requested';
    application.depotReview = {
      officer: req.user.id,
      date: Date.now(),
      priceCategory,
      price,
      notes: notes || '',
      stampedDocument: req.file ? `/uploads/${req.file.filename}` : application.adminReview.stampedDocument || application.idProof
    };

    // Initialize payment
    application.payment = {
      amount: price * application.duration,
      status: 'pending'
    };

    await application.save();

    // Log the activity
    const activity = new Activity({
      user: req.user.id,
      application: application._id,
      action: 'PAYMENT_REQUESTED',
      details: `Payment requested (${priceCategory}) ₹${price} per month for ${application.duration} months`
    });
    await activity.save();

    res.status(200).json({
      success: true,
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

// Generate pass for completed application
exports.generatePass = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ 
        success: false, 
        message: 'Application not found' 
      });
    }

    // Check if application is in payment completed state
    if (application.status !== 'payment_completed') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot generate pass for application in current state' 
      });
    }

    // Calculate expiry date (current date + duration months)
    const issueDate = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + application.duration);

    // Generate a unique pass number
    const passNumber = `SBP-${Math.floor(10000 + Math.random() * 90000)}-${new Date().getFullYear()}`;

    // Generate QR code data
    const qrData = {
      passNumber,
      studentName: application.student.name,
      route: application.route,
      validFrom: issueDate,
      validUntil: expiryDate
    };

    // Update application
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
    const activity = new Activity({
      user: req.user.id,
      application: application._id,
      action: 'PASS_GENERATED',
      details: `Pass generated (${passNumber}), valid until ${expiryDate.toISOString().split('T')[0]}`
    });
    await activity.save();

    res.status(200).json({
      success: true,
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

// Get depot officer statistics
exports.getDepotStats = async (req, res) => {
  try {
    const adminApprovedCount = await Application.countDocuments({ 
      status: 'admin_approved' 
    });
    
    const paymentRequestedCount = await Application.countDocuments({
      status: 'payment_requested',
      'depotReview.officer': req.user.id
    });
    
    const completedCount = await Application.countDocuments({
      status: 'completed',
      'depotReview.officer': req.user.id
    });

    // Get recent applications (last 10)
    const recentApplications = await Application.find({
      $or: [
        { status: 'admin_approved' },
        { 'depotReview.officer': req.user.id }
      ]
    })
      .populate('student', 'name email')
      .sort({ updatedAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      stats: {
        adminApproved: adminApprovedCount,
        paymentRequested: paymentRequestedCount,
        completed: completedCount
      },
      recentApplications
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

// Get depot officer activity history
exports.getDepotHistory = async (req, res) => {
  try {
    const activities = await Activity.find({ user: req.user.id })
      .populate('application')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: activities.length,
      activities
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