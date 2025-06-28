const API_BASE_URL = 'http://localhost:3000/api';

document.getElementById('otp-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const otp = document.getElementById('otp').value.trim();
    const messageDiv = document.getElementById('otp-message');
    messageDiv.textContent = '';
    try {
        const res = await fetch(`${API_BASE_URL}/otp/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
        });
        const data = await res.json();
        if (res.ok) {
            messageDiv.style.color = 'green';
            messageDiv.textContent = 'OTP verified! You can now log in.';
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        } else {
            messageDiv.style.color = 'red';
            messageDiv.textContent = data.message || 'OTP verification failed.';
        }
    } catch (err) {
        messageDiv.style.color = 'red';
        messageDiv.textContent = 'Network error.';
    }
});

document.getElementById('resend-otp').addEventListener('click', async function() {
    const email = document.getElementById('email').value.trim();
    const messageDiv = document.getElementById('otp-message');
    if (!email) {
        messageDiv.style.color = 'red';
        messageDiv.textContent = 'Please enter your email to resend OTP.';
        return;
    }
    messageDiv.textContent = '';
    try {
        const res = await fetch(`${API_BASE_URL}/otp/resend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (res.ok) {
            messageDiv.style.color = 'green';
            messageDiv.textContent = 'OTP resent! Please check your email.';
        } else {
            messageDiv.style.color = 'red';
            messageDiv.textContent = data.message || 'Failed to resend OTP.';
        }
    } catch (err) {
        messageDiv.style.color = 'red';
        messageDiv.textContent = 'Network error.';
    }
});
