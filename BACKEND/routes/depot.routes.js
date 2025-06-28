const express = require('express');
const depotController = require('../controllers/depot.controller');
const { auth, isDepotOfficer } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Get all admin approved applications
router.get('/admin-approved', auth, isDepotOfficer, depotController.getAdminApprovedApplications);

// Get all payment requested applications
router.get('/payment-requested', auth, isDepotOfficer, depotController.getPaymentRequestedApplications);

// Get all completed applications
router.get('/completed', auth, isDepotOfficer, depotController.getCompletedApplications);

// Request payment for an application
router.post('/request-payment/:id', 
  auth, 
  isDepotOfficer,
  upload.single('stampedDocument'),
  depotController.requestPayment
);

// Generate pass for completed application
router.post('/generate-pass/:id', 
  auth, 
  isDepotOfficer,
  depotController.generatePass
);

// Get depot officer statistics
router.get('/stats', auth, isDepotOfficer, depotController.getDepotStats);

// Get depot officer activity history
router.get('/history', auth, isDepotOfficer, depotController.getDepotHistory);

module.exports = router;