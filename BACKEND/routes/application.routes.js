const express = require('express');
const { body } = require('express-validator');
const applicationController = require('../controllers/application.controller');
const { auth, isStudent } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Get all applications (for the current user)
router.get('/', auth, applicationController.getApplications);

// Get specific application
router.get('/:id', auth, applicationController.getApplication);

// Submit a new application
router.post('/', 
  auth, 
  isStudent,
  upload.single('idProof'),
  [
    body('applicationType').isIn(['new', 'renewal']).withMessage('Invalid application type'),
    body('route').notEmpty().withMessage('Route is required'),
    body('collegeId').notEmpty().withMessage('College ID is required'),
    body('duration').isInt({ min: 1, max: 12 }).withMessage('Duration must be between 1 and 12 months')
  ],
  applicationController.createApplication
);

// Get application status
router.get('/status/:id', auth, applicationController.getApplicationStatus);

// Update application status (only accessible to admin and depot)
router.put('/status/:id', auth, applicationController.updateApplicationStatus);

module.exports = router;