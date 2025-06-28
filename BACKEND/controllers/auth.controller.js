const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Activity = require('../models/Activity');
const bcryptjs = require('bcryptjs');
const otpController = require('./otp.controller'); // Require OTP controller

// Register a new user
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, email, password, role, securityQuestion, securityAnswer } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists with this email' 
      });
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
      role,
      securityQuestion,
      securityAnswer,
      isVerified: false
    });

    await user.save();

    // Log the activity
    const activity = new Activity({
      user: user._id,
      action: 'REGISTERED',
      details: `User registered as ${role}`
    });
    await activity.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // (No direct call to sendOtp here; frontend will call /api/otp/send)

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
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

// Login user
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    console.log('DEBUG LOGIN: email:', email, 'user found:', !!user);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'No account found with this email address.' 
      });
    }
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Email not verified. Please verify your email with OTP.'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    console.log('DEBUG LOGIN: entered password:', password, 'isMatch:', isMatch);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Incorrect password.' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Log the activity
    const activity = new Activity({
      user: user._id,
      action: 'LOGGED_IN',
      details: `User logged in`
    });
    await activity.save();

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
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

// Forgot password
exports.forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, securityQuestion, securityAnswer, newPassword } = req.body;

  try {
    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Verify security question and answer (case-insensitive, trimmed)
    if (
      user.securityQuestion.trim() !== securityQuestion.trim() ||
      user.securityAnswer.trim().toLowerCase() !== securityAnswer.trim().toLowerCase()
    ) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid security question or answer' 
      });
    }

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    // Set the new password (let the model hash it)
    user.password = newPassword;
    await user.save();

    // Log the activity
    const activity = new Activity({
      user: user._id,
      action: 'PASSWORD_RESET',
      details: 'Password reset using security question'
    });
    await activity.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.'
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

// Change password
exports.changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { currentPassword, newPassword } = req.body;

  try {
    // Get user from database
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Log the activity
    const activity = new Activity({
      user: user._id,
      action: 'PASSWORD_CHANGED',
      details: 'Password changed by user'
    });
    await activity.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
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

// Get security question for a given email
exports.getSecurityQuestion = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, securityQuestion: user.securityQuestion });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};