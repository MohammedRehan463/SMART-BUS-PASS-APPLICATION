const express = require('express');
const adminController = require('../controllers/admin.controller');
const { auth, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Get all pending applications for admin review
router.get('/pending', auth, isAdmin, adminController.getPendingApplications);

// Get all processed applications (approved/rejected) by admin
router.get('/processed', auth, isAdmin, adminController.getProcessedApplications);

// Approve application
router.post('/approve/:id', 
  auth, 
  isAdmin,
  upload.single('stampedDocument'),
  adminController.approveApplication
);

// Reject application
router.post('/reject/:id', 
  auth, 
  isAdmin,
  adminController.rejectApplication
);

// Get admin statistics
router.get('/stats', auth, isAdmin, adminController.getAdminStats);

// Get admin activity history
router.get('/history', auth, isAdmin, adminController.getAdminHistory);

module.exports = router;