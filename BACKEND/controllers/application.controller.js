const { validationResult } = require('express-validator');
const Application = require('../models/Application');
const Activity = require('../models/Activity');

// Get all applications for the current user
exports.getApplications = async (req, res) => {
  try {
    let query = {};
    
    // If user is a student, only show their applications
    if (req.user.role === 'student') {
      query.student = req.user.id;
    }

    const applications = await Application.find(query)
      .populate('student', 'name email')
      .sort({ createdAt: -1 });

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

// Get specific application
exports.getApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('student', 'name email')
      .populate('adminReview.admin', 'name')
      .populate('depotReview.officer', 'name');
    
    if (!application) {
      return res.status(404).json({ 
        success: false, 
        message: 'Application not found' 
      });
    }

    // Check if user is authorized to view this application
    if (req.user.role === 'student' && application.student._id.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to view this application' 
      });
    }

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

// Create a new application
exports.createApplication = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID proof document is required' 
      });
    }

    const { applicationType, route, collegeId, duration } = req.body;
    
    // Create new application
    const application = new Application({
      student: req.user.id,
      applicationType,
      route,
      collegeId,
      duration,
      idProof: `/uploads/${req.file.filename}`,
      status: 'submitted'
    });

    await application.save();

    // Log the activity
    const activity = new Activity({
      user: req.user.id,
      application: application._id,
      action: 'APPLICATION_SUBMITTED',
      details: `${applicationType} application submitted for ${route} route`
    });
    await activity.save();

    res.status(201).json({
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

// Get application status
exports.getApplicationStatus = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('student', 'name email')
      .select('status adminReview depotReview payment pass submittedAt');
    
    if (!application) {
      return res.status(404).json({ 
        success: false, 
        message: 'Application not found' 
      });
    }

    // Check if user is authorized to view this application status
    if (req.user.role === 'student' && application.student._id.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to view this application status' 
      });
    }

    res.status(200).json({
      success: true,
      status: application.status,
      timeline: {
        submitted: application.submittedAt,
        adminReview: application.adminReview,
        depotReview: application.depotReview,
        payment: application.payment,
        completed: application.pass
      }
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

// Update application status
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['submitted', 'admin_approved', 'admin_rejected', 'payment_requested', 'payment_completed', 'completed'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status' 
      });
    }

    // Only admin and depot can update status
    if (req.user.role === 'student') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update application status' 
      });
    }

    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ 
        success: false, 
        message: 'Application not found' 
      });
    }

    application.status = status;
    await application.save();

    // Log the activity
    const activity = new Activity({
      user: req.user.id,
      application: application._id,
      action: 'STATUS_UPDATED',
      details: `Application status updated to ${status}`
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