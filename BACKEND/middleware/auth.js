const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No authentication token, access denied' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Token is invalid or expired' 
    });
  }
};

// Middleware to check for admin role
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ 
    success: false, 
    message: 'Access denied. Admin role required.' 
  });
};

// Middleware to check for depot officer role
const isDepotOfficer = (req, res, next) => {
  if (req.user && req.user.role === 'depot') {
    return next();
  }
  return res.status(403).json({ 
    success: false, 
    message: 'Access denied. Depot officer role required.' 
  });
};

// Middleware to check for student role
const isStudent = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    return next();
  }
  return res.status(403).json({ 
    success: false, 
    message: 'Access denied. Student role required.' 
  });
};

module.exports = { auth, isAdmin, isDepotOfficer, isStudent };