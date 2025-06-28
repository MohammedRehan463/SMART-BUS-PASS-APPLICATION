const express = require('express');
const userController = require('../controllers/user.controller');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get current user profile
router.get('/me', auth, userController.getCurrentUser);

// Update user profile
router.put('/me', auth, userController.updateProfile);

module.exports = router;