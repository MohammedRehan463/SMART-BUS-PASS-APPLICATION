const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Register a new user
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').isIn(['student', 'admin', 'depot']).withMessage('Invalid role'),
  body('securityQuestion').notEmpty().withMessage('Security question is required'),
  body('securityAnswer').notEmpty().withMessage('Security answer is required')
], authController.register);

// Login user
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], authController.login);

// Forgot password
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('securityQuestion').notEmpty().withMessage('Security question is required'),
  body('securityAnswer').notEmpty().withMessage('Security answer is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
], authController.forgotPassword);

// Change password
router.post('/change-password', auth, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
], authController.changePassword);

// Get security question for a given email
router.post('/get-security-question', [
  body('email').isEmail().withMessage('Please provide a valid email'),
], authController.getSecurityQuestion);

module.exports = router;