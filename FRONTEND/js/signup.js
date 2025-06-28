/**
 * Smart Bus Pass - Signup Page
 * Handles user registration functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get query parameters for role-specific signup
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role');
    
    // Get form elements
    const signupForm = document.getElementById('signup-form');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const securityQuestionSelect = document.getElementById('security-question');
    const securityAnswerInput = document.getElementById('security-answer');
    const roleInput = document.getElementById('role');
    const signupButton = document.getElementById('signup-button');
    const errorContainer = document.getElementById('error-container');
    const successContainer = document.getElementById('success-container');
    
    // Role selector elements
    const roleOptions = document.querySelectorAll('.role-option');
    
    // Set default role based on URL parameter if provided
    if (role) {
        roleInput.value = role;
        document.body.classList.add(`auth-${role}`);
        
        // Highlight the corresponding role option
        roleOptions.forEach(option => {
            if (option.dataset.role === role) {
                option.classList.add('selected');
            }
        });
    } else {
        // Set student as default role
        roleInput.value = 'student';
        document.body.classList.add('auth-student');
        roleOptions[0].classList.add('selected');
    }
    
    // Add click event listeners to role options
    roleOptions.forEach(option => {
        option.addEventListener('click', function() {
            const selectedRole = this.dataset.role;
            
            // Remove selected class from all options
            roleOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to selected option
            this.classList.add('selected');
            
            // Update hidden role input
            roleInput.value = selectedRole;
            
            // Update body class for styling
            document.body.className = `auth-container auth-${selectedRole}`;
        });
    });
    
    // Check if user is already logged in
    if (auth.checkAuth()) {
        redirectToDashboard(auth.currentUser.role);
        return;
    }
    
    // Add event listener to form submission
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Disable signup button and show loading state
        signupButton.disabled = true;
        signupButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
        hideMessages();
        
        // Get form values
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const securityQuestion = securityQuestionSelect.value;
        const securityAnswer = securityAnswerInput.value.trim();
        const role = roleInput.value;
        
        // Validate form
        if (!name || !email || !password || !securityQuestion || !securityAnswer) {
            showError('Please fill in all fields');
            resetButton();
            return;
        }
        
        // Email validation
        if (!validateEmail(email)) {
            showError('Please enter a valid email address');
            resetButton();
            return;
        }
        
        // Password validation (minimum 6 characters for backend)
        if (password.length < 6) {
            showError('Password must be at least 6 characters long');
            resetButton();
            return;
        }
        
        // Attempt to sign up
        auth.signup(name, email, password, role, securityQuestion, securityAnswer)
            .then(user => {
                // Show success message
                showSuccess('Account created successfully! Please verify your email with the OTP sent.');
                // Redirect to OTP verification page
                setTimeout(() => {
                    window.location.href = 'verify-otp.html';
                }, 1500);
            })
            .catch(error => {
                showError(error);
                resetButton();
            });
    });
    
    // Reset signup button state
    function resetButton() {
        signupButton.disabled = false;
        signupButton.innerHTML = 'Create Account';
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
    
    // Email validation function
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
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
