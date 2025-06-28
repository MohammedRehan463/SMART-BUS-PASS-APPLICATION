const express = require('express');
const studentController = require('../controllers/student.controller');
const { auth, isStudent } = require('../middleware/auth');

const router = express.Router();

// Get student's current application
router.get('/application', auth, isStudent, studentController.getCurrentApplication);

// Get student's application history
router.get('/history', auth, isStudent, studentController.getApplicationHistory);

// Get student's active pass
router.get('/pass', auth, isStudent, studentController.getActivePass);

// Download pass
router.get('/pass/:id/download', auth, isStudent, studentController.downloadPass);

module.exports = router;