const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const applicationRoutes = require('./routes/application.routes');
const adminRoutes = require('./routes/admin.routes');
const depotRoutes = require('./routes/depot.routes');
const studentRoutes = require('./routes/student.routes');
const paymentRoutes = require('./routes/payment.routes');
const otpRoutes = require('./routes/otp.routes');

// Import User model
const User = require('./models/User'); // Corrected path
const bcrypt = require('bcryptjs');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('smart-bus-pass'))

// Create uploads directory for storing files
const uploadsDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/depot', depotRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/otp', otpRoutes);


// Root route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Smart Bus Pass API' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch(err => {
        console.error('Could not connect to MongoDB', err);
        process.exit(1);
    });

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});














