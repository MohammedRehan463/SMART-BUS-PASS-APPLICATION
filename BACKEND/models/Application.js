const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicationType: {
    type: String,
    enum: ['new', 'renewal'],
    required: true
  },
  route: {
    type: String,
    required: true
  },
  collegeId: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  idProof: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['submitted', 'admin_approved', 'admin_rejected', 'payment_requested', 'payment_completed', 'completed'],
    default: 'submitted'
  },
  adminReview: {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    date: Date,
    approved: Boolean,
    rejectionReason: String,
    stampedDocument: String
  },
  depotReview: {
    officer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    date: Date,
    priceCategory: String,
    price: Number,
    notes: String,
    stampedDocument: String
  },
  payment: {
    amount: Number,
    method: String,
    date: Date,
    transactionId: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    }
  },
  pass: {
    issueDate: Date,
    expiryDate: Date,
    passNumber: String,
    qrData: String,
    status: {
      type: String,
      enum: ['pending', 'active', 'expired', 'cancelled'],
      default: 'pending'
    }
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Application', ApplicationSchema);