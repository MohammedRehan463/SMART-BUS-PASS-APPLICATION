/**
 * Smart Bus Pass - Forgot Password Page
 * Handles password reset functionality with security question verification
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get page elements
    const step1Container = document.getElementById('step-1');
    const step2Container = document.getElementById('step-2');
    const step3Container = document.getElementById('step-3');
    
    const emailForm = document.getElementById('email-form');
    const emailInput = document.getElementById('email');
    const emailSubmitBtn = document.getElementById('email-submit');
    
    const securityQuestionLabel = document.getElementById('security-question-label');
    const securityAnswerInput = document.getElementById('security-answer');
    const answerSubmitBtn = document.getElementById('answer-submit');
    
    const resetForm = document.getElementById('reset-form');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const resetSubmitBtn = document.getElementById('reset-submit');
    
    const errorContainer = document.getElementById('error-container');
    const successContainer = document.getElementById('success-container');
    
    // Store the verified email for the process
    let verifiedEmail = '';
    
    // Step 1: Email verification
    emailForm.addEventListener('submit', function(e) {
        e.preventDefault();
        emailSubmitBtn.disabled = true;
        emailSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
        hideMessages();
        const email = emailInput.value.trim();
        if (!email) {
            showError('Please enter your email address');
            resetButton(emailSubmitBtn, 'Continue');
            return;
        }
        // Fetch security question from backend
        auth.getSecurityQuestion(email.toLowerCase())
            .then(data => {
                verifiedEmail = email.toLowerCase();
                securityQuestionLabel.textContent = data.securityQuestion;
                setTimeout(() => {
                    step1Container.style.display = 'none';
                    step2Container.style.display = 'block';
                    securityAnswerInput.focus();
                    resetButton(emailSubmitBtn, 'Continue');
                }, 500);
            })
            .catch(error => {
                showError(error);
                resetButton(emailSubmitBtn, 'Continue');
            });
    });

    // Step 2: Security question verification
    answerSubmitBtn.addEventListener('click', function() {
        answerSubmitBtn.disabled = true;
        answerSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
        hideMessages();
        const securityAnswer = securityAnswerInput.value.trim();
        if (!securityAnswer) {
            showError('Please enter your answer');
            resetButton(answerSubmitBtn, 'Verify Answer');
            return;
        }
        // Move to step 3 directly, backend will verify answer in next step
        setTimeout(() => {
            step2Container.style.display = 'none';
            step3Container.style.display = 'block';
            newPasswordInput.focus();
            resetButton(answerSubmitBtn, 'Verify Answer');
        }, 500);
    });

    // Step 3: Reset password
    resetForm.addEventListener('submit', function(e) {
        e.preventDefault();
        resetSubmitBtn.disabled = true;
        resetSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting...';
        hideMessages();
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        if (!newPassword || !confirmPassword) {
            showError('Please fill in all fields');
            resetButton(resetSubmitBtn, 'Reset Password');
            return;
        }
        if (newPassword !== confirmPassword) {
            showError('Passwords do not match');
            resetButton(resetSubmitBtn, 'Reset Password');
            return;
        }
        if (newPassword.length < 6) {
            showError('Password must be at least 6 characters long');
            resetButton(resetSubmitBtn, 'Reset Password');
            return;
        }
        const securityAnswer = securityAnswerInput.value.trim();
        // Call backend to reset password (user sets new password directly)
        fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: verifiedEmail.toLowerCase(),
                securityQuestion: securityQuestionLabel.textContent,
                securityAnswer: securityAnswer,
                newPassword: newPassword
            })
        })
        .then(async res => {
            const data = await res.json();
            if (!res.ok) throw (data.message || 'Password reset failed');
            showSuccess('Password reset successful. You can now log in with your new password.');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
        })
        .catch(error => {
            showError(error);
            resetButton(resetSubmitBtn, 'Reset Password');
        });
    });
    
    // Helper functions
    function resetButton(button, text) {
        button.disabled = false;
        button.innerHTML = text;
    }
    
    function showError(message) {
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
        successContainer.style.display = 'none';
    }
    
    function showSuccess(message) {
        successContainer.textContent = message;
        successContainer.style.display = 'block';
        errorContainer.style.display = 'none';
    }
    
    function hideMessages() {
        errorContainer.style.display = 'none';
        successContainer.style.display = 'none';
    }
});
