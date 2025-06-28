/**
 * Smart Bus Pass - Main Script
 * Handles global functionality and initializations
 */

// Main application controller
const app = {
    // Initialize application
    init: function() {
        // Check if app is initialized already
        if (localStorage.getItem('appInitialized')) {
            return;
        }
        
        // Initialize localStorage with sample data if needed
        this.initSampleData();
        
        // Mark app as initialized
        localStorage.setItem('appInitialized', 'true');
    },
    
    // Initialize sample data for demo purposes
    initSampleData: function() {
        // Check if users already exist
        const users = JSON.parse(localStorage.getItem('users'));
        
        // If users are already initialized, don't re-initialize
        if (users && users.length > 0) {
            return;
        }
        
        // Initialize with sample users
        const sampleUsers = [
            {
                name: "Student User",
                email: "student@example.com",
                password: "password",
                role: "student",
                securityQ: "Your pet name?",
                securityA: "Rex",
                history: [],
                createdAt: new Date().getTime()
            },
            {
                name: "Admin User",
                email: "admin@example.com",
                password: "password",
                role: "admin",
                securityQ: "Your birth city?",
                securityA: "Delhi",
                history: [],
                createdAt: new Date().getTime()
            },
            {
                name: "Depot Officer",
                email: "depot@example.com",
                password: "password",
                role: "depot",
                securityQ: "Your first school?",
                securityA: "St. Mary's",
                history: [],
                createdAt: new Date().getTime()
            }
        ];
        
        // Store users in localStorage
        localStorage.setItem('users', JSON.stringify(sampleUsers));
        
        // Initialize empty applications array
        localStorage.setItem('applications', JSON.stringify([]));
        
        console.log('Sample data initialized for demo purposes');
    }
};

// Initialize app on page load
document.addEventListener('DOMContentLoaded', function() {
    app.init();
});
