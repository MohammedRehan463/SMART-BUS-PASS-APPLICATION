const User = require('../models/User');
const Activity = require('../models/Activity');

// Get current user profile
exports.getCurrentUser = async (req, res) => {
  try {
    // Get user without password
    const user = await User.findById(req.user.id).select('-password -securityAnswer');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.status(200).json({
      success: true,
      user
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

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    
    // Update only allowed fields
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { name },
      { new: true }
    ).select('-password -securityAnswer');
    
    if (!updatedUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Log the activity
    const activity = new Activity({
      user: req.user.id,
      action: 'PROFILE_UPDATED',
      details: 'User profile updated'
    });
    await activity.save();

    res.status(200).json({
      success: true,
      user: updatedUser
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