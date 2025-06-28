/**
 * Smart Bus Pass - Login Page
 * Handles user login functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get query parameters for role-specific login
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role');
    
    // Set role-specific styling
    if (role) {
        document.body.classList.add(`auth-${role}`);
        
        // Set form heading based on role
        const loginHeader = document.querySelector('.auth-header h1');
        if (loginHeader) {
            if (role === 'student') {
                loginHeader.textContent = 'Student Login';
            } else if (role === 'admin') {
                loginHeader.textContent = 'Admin Login';
            } else if (role === 'depot') {
                loginHeader.textContent = 'Depot Officer Login';
            }
        }
    }
    
    // Check if user is already logged in
    if (auth.checkAuth()) {
        redirectToDashboard(auth.currentUser.role);
        return;
    }
    
    // Get form elements
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('login-button');
    const errorContainer = document.getElementById('error-container');
    const successContainer = document.getElementById('success-container');
    
    // Add event listener to form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Disable login button and show loading state
        loginButton.disabled = true;
        loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        hideMessages();
        
        // Get form values
        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;
        
        // Validate form
        if (!email || !password) {
            showError('Please fill in all fields');
            resetButton();
            return;
        }
        
        // Attempt to log in
        auth.login(email, password)
            .then(user => {
                // Check if user role matches the requested role
                if (role && user.role !== role) {
                    showError(`This login is for ${role} accounts only. Please use the appropriate login.`);
                    resetButton();
                    return;
                }
                
                // Show success message
                showSuccess('Login successful! Redirecting to dashboard...');
                
                // Redirect to appropriate dashboard based on user role
                setTimeout(() => {
                    redirectToDashboard(user.role);
                }, 1000);
            })
            .catch(error => {
                showError(error);
                resetButton();
            });
    });
    
    // Reset login button state
    function resetButton() {
        loginButton.disabled = false;
        loginButton.innerHTML = 'Login';
    }
    
    // Show error message
    function showError(message) {
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
        successContainer.style.display = 'none';
    }
    
    // Show success message
    function showSuccess(message) {
        successContainer.textContent = message;
        successContainer.style.display = 'block';
        errorContainer.style.display = 'none';
    }
    
    // Hide all messages
    function hideMessages() {
        errorContainer.style.display = 'none';
        successContainer.style.display = 'none';
    }
    
    // Redirect to appropriate dashboard
    function redirectToDashboard(userRole) {
        switch (userRole) {
            case 'student':
                window.location.href = 'dashboard-student.html';
                break;
            case 'admin':
                window.location.href = 'dashboard-admin.html';
                break;
            case 'depot':
                window.location.href = 'dashboard-depot.html';
                break;
            default:
                window.location.href = '../index.html';
        }
    }
});
