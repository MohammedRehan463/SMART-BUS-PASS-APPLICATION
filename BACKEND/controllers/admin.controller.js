const Application = require('../models/Application');
const Activity = require('../models/Activity');

// Get all pending applications for admin review
exports.getPendingApplications = async (req, res) => {
  try {
    const applications = await Application.find({ status: 'submitted' })
      .populate('student', 'name email')
      .sort({ submittedAt: 1 });

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

// Get all processed applications (approved/rejected) by admin
exports.getProcessedApplications = async (req, res) => {
  try {
    const applications = await Application.find({
      status: { $in: ['admin_approved', 'admin_rejected'] }
    })
      .populate('student', 'name email')
      .sort({ 'adminReview.date': -1 });

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

// Approve application
exports.approveApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ 
        success: false, 
        message: 'Application not found' 
      });
    }

    // Check if application is in submitted state
    if (application.status !== 'submitted') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot approve application in current state' 
      });
    }

    // Update application
    application.status = 'admin_approved';
    // Save stampedDocument at top level for easy access by depot
    if (req.file) {
      application.stampedDocument = `/uploads/${req.file.filename}`;
    } else if (application.idProof) {
      application.stampedDocument = application.idProof;
    }
    application.adminReview = {
      admin: req.user.id,
      date: Date.now(),
      approved: true,
      stampedDocument: application.stampedDocument
    };

    await application.save();
    // DEBUG: Log after saving
    console.log('Application approved:', application._id, 'Status:', application.status);

    // Log the activity
    const activity = new Activity({
      user: req.user.id,
      application: application._id,
      action: 'APPLICATION_APPROVED',
      details: `Application approved by admin`
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

// Reject application
exports.rejectApplication = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    
    if (!rejectionReason) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rejection reason is required' 
      });
    }

    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ 
        success: false, 
        message: 'Application not found' 
      });
    }

    // Check if application is in submitted state
    if (application.status !== 'submitted') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot reject application in current state' 
      });
    }

    // Update application
    application.status = 'admin_rejected';
    application.adminReview = {
      admin: req.user.id,
      date: Date.now(),
      approved: false,
      rejectionReason
    };

    await application.save();

    // Log the activity
    const activity = new Activity({
      user: req.user.id,
      application: application._id,
      action: 'APPLICATION_REJECTED',
      details: `Application rejected by admin: ${rejectionReason}`
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

// Get admin statistics
exports.getAdminStats = async (req, res) => {
  try {
    const pendingCount = await Application.countDocuments({ status: 'submitted' });
    
    const approvedCount = await Application.countDocuments({
      status: 'admin_approved',
      'adminReview.admin': req.user.id
    });
    
    const rejectedCount = await Application.countDocuments({
      status: 'admin_rejected',
      'adminReview.admin': req.user.id
    });

    // Get recent applications (last 10)
    const recentApplications = await Application.find()
      .populate('student', 'name email')
      .sort({ submittedAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      stats: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount
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

// Get admin activity history
exports.getAdminHistory = async (req, res) => {
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