const Application = require('../models/Application');
const Activity = require('../models/Activity');

// Get student's current application
exports.getCurrentApplication = async (req, res) => {
  try {
    // Find the most recent active application
    const application = await Application.findOne({ 
      student: req.user.id,
      status: { $ne: 'admin_rejected' }
    })
      .sort({ createdAt: -1 });

    if (!application) {
      return res.status(200).json({ 
        success: true, 
        hasApplication: false,
        message: 'No active application found' 
      });
    }

    res.status(200).json({
      success: true,
      hasApplication: true,
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

// Get student's application history
exports.getApplicationHistory = async (req, res) => {
  try {
    const applications = await Application.find({ student: req.user.id })
      .sort({ createdAt: -1 });

    const activities = await Activity.find({ 
      user: req.user.id,
      application: { $exists: true, $ne: null }
    })
      .populate('application')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      applications,
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

// Get student's active pass
exports.getActivePass = async (req, res) => {
  try {
    const application = await Application.findOne({ 
      student: req.user.id,
      status: 'completed',
      'pass.status': 'active'
    })
      .sort({ 'pass.issueDate': -1 });

    if (!application) {
      return res.status(200).json({ 
        success: true, 
        hasActivePass: false,
        message: 'No active pass found' 
      });
    }

    // Check if pass is expired
    const now = new Date();
    if (now > application.pass.expiryDate) {
      application.pass.status = 'expired';
      await application.save();
      
      return res.status(200).json({
        success: true,
        hasActivePass: false,
        message: 'Pass has expired',
        expiredPass: application.pass
      });
    }

    res.status(200).json({
      success: true,
      hasActivePass: true,
      pass: application.pass,
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

// Download pass
exports.downloadPass = async (req, res) => {
  try {
    console.log('DownloadPass called with:', {
      id: req.params.id,
      user: req.user.id
    });
    let application = await Application.findOne({ 
      _id: req.params.id,
      student: req.user.id,
      status: { $in: ['completed', 'payment_completed'] }
    }).populate('student', 'name email');

    if (!application) {
      // Log all applications for this student for debugging
      const allApps = await Application.find({ student: req.user.id });
      console.log('No application found for download. All applications for this student:', allApps.map(a => ({
        _id: a._id,
        status: a.status,
        pass: a.pass,
        payment: a.payment
      })));
      return res.status(404).json({ 
        success: false, 
        message: 'Pass not found' 
      });
    }

    // If pass is missing or incomplete, generate it now
    if (!application.pass || !application.pass.issueDate || !application.pass.expiryDate || !application.pass.passNumber) {
      // Defensive: Ensure student is populated
      if (!application.student || !application.student.name) {
        await application.populate('student', 'name email');
      }
      const issueDate = new Date();
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + (application.duration || 1));
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
    }

    // Check if pass is expired
    const now = new Date();
    if (now > application.pass.expiryDate) {
      application.pass.status = 'expired';
      await application.save();
      return res.status(400).json({
        success: false,
        message: 'Pass has expired'
      });
    }

    // Debug: log application and pass before sending response
    console.log('DownloadPass application:', JSON.stringify(application, null, 2));
    console.log('DownloadPass application.pass:', JSON.stringify(application.pass, null, 2));

    // Generate pass data
    const passData = {
      passNumber: application.pass.passNumber,
      studentName: application.student.name,
      studentEmail: application.student.email,
      route: application.route,
      collegeId: application.collegeId,
      issueDate: application.pass.issueDate,
      expiryDate: application.pass.expiryDate,
      duration: application.duration,
      qrData: application.pass.qrData
    };

    // Log the activity
    const activity = new Activity({
      user: req.user.id,
      application: application._id,
      action: 'PASS_DOWNLOADED',
      details: `Pass downloaded: ${application.pass.passNumber}`
    });
    await activity.save();

    res.status(200).json({
      success: true,
      passData
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