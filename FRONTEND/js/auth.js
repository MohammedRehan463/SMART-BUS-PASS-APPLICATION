/**
 * Smart Bus Pass - Authentication Management
 * Handles user authentication, session management and utility functions
 */

// Global authentication state and functions
const auth = {
    // Current logged in user info
    currentUser: null,
    
    // Initialize authentication system and check for existing session
    init: function() {
        this.checkAuth();
    },
    
    // Log in user
    login: function(email, password) {
        return fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })
        .then(async res => {
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw (data.message || 'Login failed');
            }
            return res.json();
        })
        .then(data => {
            if (data.user && data.token) {
                this.setCurrentUser(data.user);
                sessionStorage.setItem('token', data.token);
                return data.user;
            } else {
                throw (data.message || 'Login failed');
            }
        });
    },
    
    // Register new user
    signup: function(name, email, password, role, securityQuestion, securityAnswer) {
        if (password.length < 6) {
            return Promise.reject('Password must be at least 6 characters long');
        }
        return fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                email,
                password,
                role,
                securityQuestion,
                securityAnswer
            })
        })
        .then(async res => {
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw (data.message || 'Signup failed');
            }
            return res.json();
        })
        .then(data => {
            // After registration, send OTP
            return fetch(`${API_BASE_URL}/otp/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })
            .then(() => {
                // Prompt user to enter OTP (UI logic needed)
                alert('Registration successful! Please check your email for OTP and verify.');
                window.location.href = 'verify-otp.html';
                return data.user;
            });
        });
    },
    
    // Log out current user
    logout: function() {
        // Remove current user from session storage
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('token');
        this.currentUser = null;
        
        // Redirect to login page
        window.location.href = '../index.html';
    },
    
    // Check if user is authenticated
    checkAuth: function() {
        // Get current user from session storage
        const userStr = sessionStorage.getItem('currentUser');
        
        if (userStr) {
            this.currentUser = JSON.parse(userStr);
            return true;
        }
        
        return false;
    },
    
    // Set current user in session
    setCurrentUser: function(user) {
        this.currentUser = user;
        sessionStorage.setItem('currentUser', JSON.stringify(user));
    },
    
    // Find user by email (not available client-side)
    findUserByEmail: function(email) {
        // Not supported: must use backend for user lookup
        return null;
    },
    
    // Update user data (localStorage removed)
    updateUser: function(userEmail, updatedData) {
        return false;
    },
    
    // Add history entry to user (localStorage removed)
    addHistory: function(userEmail, historyEntry) {
        return false;
    },
    
    // Reset password (calls backend)
    resetPassword: function(email, securityAnswer, newPassword) {
        return fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                securityAnswer,
                newPassword
            })
        })
        .then(async res => {
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw (data.message || 'Password reset failed');
            }
            return res.json();
        });
    },
    
    // Change password (localStorage removed)
    changePassword: function(email, currentPassword, newPassword) {
        return new Promise((resolve, reject) => {
            reject("Password change is disabled. Please use server-side change.");
        });
    },
    
    // Initialize database with sample users if none exist (localStorage removed)
    initializeDatabase: function() {
        // No-op
    },
    
    // Get security question for a given email
    getSecurityQuestion: function(email) {
        return fetch(`${API_BASE_URL}/auth/get-security-question`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        })
        .then(async res => {
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw (data.message || 'Failed to get security question');
            }
            return res.json();
        });
    },
    
    // Add OTP verification
    verifyOtp: function(email, otp) {
        return fetch(`${API_BASE_URL}/otp/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
        })
        .then(async res => {
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw (data.message || 'OTP verification failed');
            }
            return res.json();
        });
    }
};

// Set your backend API base URL here for local development
const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000/api';

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    auth.init();
});
