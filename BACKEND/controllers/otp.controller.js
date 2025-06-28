const User = require('../models/User');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// In-memory store for OTPs (for demo; use DB/Redis in production)
const otpStore = {};

// Configure nodemailer transporter (Gmail example)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // set in .env
    pass: process.env.GMAIL_PASS  // set in .env (App Password)
  }
});

async function sendOtpMail(email, otp) {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP is: ${otp}`
  };
  await transporter.sendMail(mailOptions);
}

exports.sendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email required' });

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000 };

  try {
    await sendOtpMail(email, otp);
    res.json({ success: true, message: 'OTP sent to email' });
  } catch (err) {
    console.error('Failed to send OTP email:', err);
    res.status(500).json({ success: false, message: 'Failed to send OTP email' });
  }
};

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP required' });

  const record = otpStore[email];
  if (!record || record.otp !== otp || Date.now() > record.expires) {
    return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
  }

  // Mark user as verified
  const user = await User.findOneAndUpdate({ email }, { $set: { isVerified: true } });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  delete otpStore[email];
  res.json({ success: true, message: 'OTP verified' });
};

// Resend OTP (same as sendOtp, but can add rate limiting if needed)
exports.resendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email required' });

  // Generate new 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000 };

  try {
    await sendOtpMail(email, otp);
    res.json({ success: true, message: 'OTP resent to email' });
  } catch (err) {
    console.error('Failed to resend OTP email:', err);
    res.status(500).json({ success: false, message: 'Failed to resend OTP email' });
  }
};
