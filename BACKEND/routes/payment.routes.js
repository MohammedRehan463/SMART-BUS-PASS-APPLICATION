const express = require('express');
const { body } = require('express-validator');
const paymentController = require('../controllers/payment.controller');
const { auth, isStudent } = require('../middleware/auth');

const router = express.Router();

// Process payment for an application
router.post('/process/:id', 
  auth, 
  isStudent,
  [
    body('paymentMethod').isIn(['phonepe', 'paytm', 'googlepay']).withMessage('Invalid payment method'),
    body('transactionId').notEmpty().withMessage('Transaction ID is required')
  ],
  paymentController.processPayment
);

// Verify payment status
router.get('/status/:id', auth, paymentController.getPaymentStatus);

module.exports = router;