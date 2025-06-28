/**
 * Smart Bus Pass - Student Dashboard
 * Handles student-specific functionality
 */

// Student Dashboard Controller
const studentDashboard = {
    // Current application data
    currentApplication: null,
    
    // Initialize student dashboard
    init: function() {
        // Check if user role is student
        if (!auth.currentUser || auth.currentUser.role !== 'student') {
            window.location.href = 'login.html';
            return;
        }
        
        // Load current application if exists
        this.loadCurrentApplication();
        
        // Initialize dashboard tabs
        this.initDashboardTab();
        this.initApplicationTab();
        this.initStatusTab();
        this.initHistoryTab();
        
        // Initialize payment modal
        this.initPaymentModal();
    },
    
    // Load current application if exists
    loadCurrentApplication: async function() {
        try {
            const res = await fetch(`${API_BASE_URL}/student/application`, {
                headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
            });
            if (!res.ok) throw new Error('Failed to fetch current application');
            const data = await res.json();
            if (data && data.success && data.hasApplication && data.application) {
                this.currentApplication = data.application;
            } else {
                this.currentApplication = null;
            }
        } catch (err) {
            this.currentApplication = null;
            console.error('Error loading current application:', err);
        }
        // Update UI based on application status
        this.updateDashboardUI();
    },
    
    // Update dashboard UI based on application status
    updateDashboardUI: function() {
        // Update dashboard stats
        const currentStatusElement = document.getElementById('current-status');
        const expiryDateElement = document.getElementById('expiry-date');
        
        // Update quick action buttons
        const newApplicationBtn = document.getElementById('new-application-btn');
        const renewPassBtn = document.getElementById('renew-pass-btn');
        const viewPassBtn = document.getElementById('view-pass-btn');
        
        if (this.currentApplication) {
            // Update status display
            if (currentStatusElement) {
                // Map backend status to user-friendly label
                let statusLabel = this.currentApplication.status;
                if (statusLabel === 'payment_requested') statusLabel = 'Payment Required';
                else if (statusLabel === 'payment_completed') statusLabel = 'Payment Done';
                else if (statusLabel === 'completed') statusLabel = 'Completed';
                else if (statusLabel === 'admin_approved') statusLabel = 'Admin Approved';
                else if (statusLabel === 'admin_rejected') statusLabel = 'Rejected';
                else if (statusLabel === 'submitted') statusLabel = 'Submitted';
                currentStatusElement.textContent = statusLabel;
            }
            
            // Set expiry date if pass is issued
            if (expiryDateElement) {
                if (this.currentApplication.status === 'Payment Done') {
                    // Calculate expiry date based on application date and duration
                    const durationMonths = parseInt(this.currentApplication.duration);
                    const startDate = new Date(this.currentApplication.paymentDate || this.currentApplication.submittedDate);
                    const expiryDate = new Date(startDate);
                    expiryDate.setMonth(expiryDate.getMonth() + durationMonths);
                    
                    expiryDateElement.textContent = expiryDate.toLocaleDateString();
                } else {
                    // Show validity and pass id from backend pass if available
                    if (this.currentApplication && this.currentApplication.pass && this.currentApplication.pass.issueDate && this.currentApplication.pass.expiryDate) {
                        const startDate = new Date(this.currentApplication.pass.issueDate);
                        const expiryDate = new Date(this.currentApplication.pass.expiryDate);
                        if (expiryDateElement) {
                            expiryDateElement.textContent = `${startDate.toLocaleDateString()} to ${expiryDate.toLocaleDateString()}`;
                        }
                    } else {
                        // fallback to old logic
                        if (expiryDateElement) {
                            expiryDateElement.textContent = 'N/A';
                        }
                    }
                }
            }
            
            // Disable new application button if there's an active application
            if (newApplicationBtn) {
                newApplicationBtn.disabled = true;
                newApplicationBtn.title = 'You already have an active application';
            }
            
            // Show view pass button if payment is done
            if (viewPassBtn && this.currentApplication.status === 'Payment Done') {
                viewPassBtn.style.display = 'block';
            }
            
        } else {
            // No active application
            if (currentStatusElement) {
                currentStatusElement.textContent = 'No Application';
            }
            
            if (expiryDateElement) {
                expiryDateElement.textContent = 'N/A';
            }
            
            // Enable new application button
            if (newApplicationBtn) {
                newApplicationBtn.disabled = false;
                newApplicationBtn.title = '';
            }
            
            // Hide view pass button
            if (viewPassBtn) {
                viewPassBtn.style.display = 'none';
            }
        }
        
        // Update status tab content
        this.updateStatusTab();
    },
    
    // Initialize dashboard tab
    initDashboardTab: function() {
        // Get quick action buttons
        const newApplicationBtn = document.getElementById('new-application-btn');
        const renewPassBtn = document.getElementById('renew-pass-btn');
        const viewPassBtn = document.getElementById('view-pass-btn');
        
        // New application button
        if (newApplicationBtn) {
            newApplicationBtn.addEventListener('click', () => {
                // Navigate to application tab
                const applicationTabLink = document.querySelector('.sidebar-menu a[data-tab="application"]');
                if (applicationTabLink) {
                    applicationTabLink.click();
                }
            });
        }
        
        // Renew pass button
        if (renewPassBtn) {
            renewPassBtn.addEventListener('click', () => {
                // Navigate to application tab and set type to renewal
                const applicationTabLink = document.querySelector('.sidebar-menu a[data-tab="application"]');
                if (applicationTabLink) {
                    applicationTabLink.click();
                    
                    // Set application type to renewal
                    const typeSelect = document.getElementById('application-type');
                    if (typeSelect) {
                        typeSelect.value = 'renewal';
                    }
                }
            });
        }
        
        // View pass button
        if (viewPassBtn) {
            viewPassBtn.addEventListener('click', () => {
                this.downloadPass();
            });
        }
    },
    
    // Initialize application tab
    initApplicationTab: function() {
        const applicationForm = document.getElementById('application-form');
        const fileUploadArea = document.getElementById('file-upload-area');
        const idProofInput = document.getElementById('id-proof');
        const uploadPreview = document.getElementById('upload-preview');
        
        // Initialize file upload
        if (fileUploadArea && idProofInput) {
            fileUploadArea.addEventListener('click', () => {
                idProofInput.click();
            });
            
            // Drag and drop functionality
            fileUploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                fileUploadArea.style.borderColor = 'var(--primary-color)';
                fileUploadArea.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
            });
            
            fileUploadArea.addEventListener('dragleave', () => {
                fileUploadArea.style.borderColor = '#ddd';
                fileUploadArea.style.backgroundColor = '';
            });
            
            fileUploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                fileUploadArea.style.borderColor = '#ddd';
                fileUploadArea.style.backgroundColor = '';
                
                if (e.dataTransfer.files.length) {
                    idProofInput.files = e.dataTransfer.files;
                    
                    // Trigger change event
                    const event = new Event('change');
                    idProofInput.dispatchEvent(event);
                }
            });
            
            // Show preview on file select
            idProofInput.addEventListener('change', () => {
                if (idProofInput.files.length) {
                    const file = idProofInput.files[0];
                    
                    // Check if file is an image
                    if (!file.type.startsWith('image/')) {
                        alert('Please select an image file');
                        idProofInput.value = '';
                        return;
                    }
                    
                    // Check file size (max 2MB)
                    if (file.size > 2 * 1024 * 1024) {
                        alert('File size should be less than 2MB');
                        idProofInput.value = '';
                        return;
                    }
                    
                    // Show preview
                    const loadingIndicator = document.createElement('div');
                    loadingIndicator.className = 'image-loading';
                    loadingIndicator.id = 'upload-loading';
                    loadingIndicator.textContent = 'Loading image preview...';
                    
                    // Insert loading indicator after upload area
                    if (uploadPreview.parentNode) {
                        uploadPreview.parentNode.insertBefore(loadingIndicator, uploadPreview.nextSibling);
                    }
                    
                    // Hide existing preview
                    uploadPreview.style.display = 'none';
                    
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        // Remove loading indicator
                        const loadingElement = document.getElementById('upload-loading');
                        if (loadingElement) {
                            loadingElement.parentNode.removeChild(loadingElement);
                        }
                        
                        // Set image source and show preview
                        uploadPreview.src = e.target.result;
                        uploadPreview.style.display = 'block';
                        
                        // Add error handling
                        uploadPreview.onerror = function() {
                            uploadPreview.style.display = 'none';
                            const errorElement = document.createElement('div');
                            errorElement.className = 'image-error';
                            errorElement.textContent = 'Error loading image preview. The file may be corrupted.';
                            if (uploadPreview.parentNode) {
                                uploadPreview.parentNode.insertBefore(errorElement, uploadPreview.nextSibling);
                            }
                        };
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
        
        // Handle form submission
        if (applicationForm) {
            applicationForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                // Validate form
                const applicationType = document.getElementById('application-type').value;
                const route = document.getElementById('route').value;
                const collegeId = document.getElementById('college-id').value;
                const duration = document.getElementById('duration').value;
                if (!applicationType || !route || !collegeId || !duration || !idProofInput.files.length) {
                    alert('Please fill in all fields and upload your ID proof');
                    return;
                }
                // Disable submit button
                const submitBtn = document.getElementById('submit-application');
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
                try {
                    const applicationData = {
                        applicationType: applicationType, // must match backend
                        route: route,
                        collegeId: collegeId,
                        duration: duration
                    };
                    const idProofFile = idProofInput.files[0];
                    await dashboardCommon.saveApplication(applicationData, idProofFile);
                    await studentDashboard.loadCurrentApplication();
                    alert('Application submitted successfully!');
                    applicationForm.reset();
                    uploadPreview.style.display = 'none';
                } catch (err) {
                    alert('Failed to submit application: ' + err.message);
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class=\"fas fa-paper-plane\"></i> Submit Application';
                }
            });
        }
    },
    
    // Initialize status tab
    initStatusTab: function() {
        // Start application button in status tab
        const startApplicationBtn = document.getElementById('start-application-btn');
        if (startApplicationBtn) {
            startApplicationBtn.addEventListener('click', () => {
                const applicationTabLink = document.querySelector('.sidebar-menu a[data-tab="application"]');
                if (applicationTabLink) {
                    applicationTabLink.click();
                }
            });
        }
        
        // Pay now button
        const payNowBtn = document.getElementById('pay-now-btn');
        if (payNowBtn) {
            payNowBtn.addEventListener('click', () => {
                // Open payment modal
                const paymentModal = document.getElementById('payment-modal');
                if (paymentModal) {
                    paymentModal.classList.add('active');
                }
            });
        }
        
        // Download pass button
        const downloadPassBtn = document.getElementById('download-pass-btn');
        if (downloadPassBtn) {
            downloadPassBtn.addEventListener('click', () => {
                this.downloadPass();
            });
        }
        
        // Update status tab UI
        this.updateStatusTab();
    },
    
    // Update status tab UI
    updateStatusTab: function() {
        const noApplication = document.getElementById('no-application');
        const applicationStatus = document.getElementById('application-status');
        
        // Status timeline elements
        const submittedStep = document.getElementById('submitted-step');
        const adminStep = document.getElementById('admin-step');
        const depotStep = document.getElementById('depot-step');
        const paymentStep = document.getElementById('payment-step');
        const completedStep = document.getElementById('completed-step');
        
        // Status text elements
        const submittedDate = document.getElementById('submitted-date');
        const adminStatus = document.getElementById('admin-status');
        const depotStatus = document.getElementById('depot-status');
        const paymentStatus = document.getElementById('payment-status');
        const completedStatus = document.getElementById('completed-status');
        const paymentSection = document.getElementById('payment-section');
        const downloadSection = document.getElementById('download-section');

        if (!this.currentApplication) {
            if (noApplication) noApplication.style.display = 'block';
            if (applicationStatus) applicationStatus.style.display = 'none';
            return;
        }
        if (noApplication) noApplication.style.display = 'none';
        if (applicationStatus) applicationStatus.style.display = 'block';

        // Use createdAt or submittedAt for submitted date
        if (submittedDate) {
            submittedDate.textContent = dashboardCommon.formatDate(this.currentApplication.createdAt || this.currentApplication.submittedAt);
        }

        // Map backend status to frontend labels
        const status = this.currentApplication.status;
        // Admin step
        if (adminStatus) {
            if (status === 'submitted') {
                adminStatus.textContent = 'Pending';
                adminStatus.style.color = '';
            } else if (status === 'admin_rejected') {
                adminStatus.textContent = 'Rejected';
                adminStatus.style.color = 'var(--danger-color)';
            } else if (status === 'admin_approved' || status === 'payment_requested' || status === 'payment_completed' || status === 'completed') {
                adminStatus.textContent = 'Approved';
                adminStatus.style.color = 'var(--success-color)';
            } else {
                adminStatus.textContent = '-';
                adminStatus.style.color = '';
            }
        }
        // Depot step
        if (depotStatus) {
            if (status === 'admin_approved') {
                depotStatus.textContent = 'In progress';
                depotStatus.style.color = 'var(--warning-color)';
            } else if (status === 'payment_requested' || status === 'payment_completed' || status === 'completed') {
                depotStatus.textContent = 'Completed';
                depotStatus.style.color = 'var(--success-color)';
            } else {
                depotStatus.textContent = 'Not started';
                depotStatus.style.color = '';
            }
        }
        // Payment step
        if (paymentStatus) {
            if (status === 'payment_requested') {
                paymentStatus.textContent = 'Payment required';
                paymentStatus.style.color = 'var(--warning-color)';
            } else if (status === 'payment_completed' || status === 'completed') {
                paymentStatus.textContent = 'Paid';
                paymentStatus.style.color = 'var(--success-color)';
            } else {
                paymentStatus.textContent = 'Not started';
                paymentStatus.style.color = '';
            }
        }
        // Completed step
        if (completedStatus) {
            if (status === 'completed') {
                completedStatus.textContent = 'Pass issued';
                completedStatus.style.color = 'var(--success-color)';
            } else {
                completedStatus.textContent = 'Pending';
                completedStatus.style.color = '';
            }
        }
        // Show/hide action sections based on status
        if (paymentSection) {
            paymentSection.style.display = (status === 'payment_requested') ? 'block' : 'none';
        }
        if (downloadSection) {
            // Allow download if status is payment_completed or completed
            downloadSection.style.display = (status === 'payment_completed' || status === 'completed') ? 'block' : 'none';
        }
    },
    
    // Initialize history tab
    initHistoryTab: function() {
        this.loadHistory();
    },
    
    // Load history data
    loadHistory: async function() {
        const historyBody = document.getElementById('history-body');
        const noHistory = document.getElementById('no-history');
        if (historyBody) historyBody.innerHTML = '';
        if (noHistory) noHistory.style.display = 'none';

        try {
            const res = await fetch(`${API_BASE_URL}/student/history`, {
                headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
            });
            if (!res.ok) throw new Error('Failed to fetch history');
            const data = await res.json();
            const applications = Array.isArray(data.applications) ? data.applications : [];
            const activities = Array.isArray(data.activities) ? data.activities : [];

            // Combine and sort by date (activities may have 'date', applications may have 'createdAt')
            const history = [
                ...activities.map(a => {
                    let actionLabel = 'Activity';
                    if (a.action === 'APPLICATION_SUBMITTED') actionLabel = 'Application Submitted';
                    else if (a.action === 'APPLICATION_APPROVED') actionLabel = 'Approved by Admin';
                    else if (a.action === 'APPLICATION_REJECTED') actionLabel = 'Rejected by Admin';
                    else if (a.action === 'PAYMENT_REQUESTED') actionLabel = 'Payment Requested';
                    else if (a.action === 'PAYMENT_COMPLETED') actionLabel = 'Payment Completed';
                    else if (a.action === 'PASS_GENERATED') actionLabel = 'Pass Generated';
                    else if (a.action === 'STATUS_UPDATED') actionLabel = 'Status Updated';
                    // Add more mappings as needed
                    return {
                        date: a.date || a.createdAt,
                        action: actionLabel,
                        status: (a.application && a.application.status) || '-',
                        details: (a.application && a.application.route ? a.application.route : (a.details || '-'))
                    };
                }),
                ...applications.map(app => ({
                    date: app.createdAt,
                    action: 'Application Created',
                    status: app.status,
                    details: app.route
                }))
            ];
            // Remove duplicate entries by date+action+status+details
            const uniqueHistory = [];
            const seen = new Set();
            for (const entry of history) {
                const key = `${entry.date}-${entry.action}-${entry.status}-${entry.details}`;
                if (!seen.has(key)) {
                    uniqueHistory.push(entry);
                    seen.add(key);
                }
            }
            const sortedHistory = uniqueHistory.filter(h => h.date).sort((a, b) => new Date(b.date) - new Date(a.date));

            if (sortedHistory.length === 0) {
                if (noHistory) noHistory.style.display = 'block';
                return;
            }
            if (historyBody) {
                historyBody.innerHTML = sortedHistory.map(entry => `
                    <tr>
                        <td>${dashboardCommon.formatDate(entry.date)}</td>
                        <td>${entry.action}</td>
                        <td>
                            <span class="status status-${this.getStatusClass(entry.status)}">
                                ${entry.status}
                            </span>
                        </td>
                        <td>${entry.details || '-'}</td>
                    </tr>
                `).join('');
            }
        } catch (err) {
            if (noHistory) noHistory.style.display = 'block';
            if (historyBody) historyBody.innerHTML = '<tr><td colspan="4">Failed to load history</td></tr>';
        }
    },
    
    // Get CSS class for status
    getStatusClass: function(status) {
        if (status === 'Submitted to Admin') return 'submitted';
        if (status === 'Approved by Admin') return 'approved';
        if (status === 'Rejected by Admin') return 'rejected';
        if (status === 'Payment Requested') return 'payment';
        if (status === 'Payment Done') return 'approved';
        if (status === 'Completed') return 'completed';
        return '';
    },
    
    // Initialize payment modal
    initPaymentModal: function() {
        const paymentModal = document.getElementById('payment-modal');
        const closePaymentModal = document.getElementById('close-payment-modal');
        const cancelPayment = document.getElementById('cancel-payment');
        const processPayment = document.getElementById('process-payment');
        const paymentOptions = document.querySelectorAll('.payment-option');
        const paymentDetails = document.querySelector('.payment-details');
        const upiPin = document.getElementById('upi-pin');
        
        // Close modal buttons
        if (closePaymentModal) {
            closePaymentModal.addEventListener('click', () => {
                paymentModal.classList.remove('active');
                this.resetPaymentModal();
            });
        }
        
        if (cancelPayment) {
            cancelPayment.addEventListener('click', () => {
                paymentModal.classList.remove('active');
                this.resetPaymentModal();
            });
        }
        
        // Close modal when clicking outside
        if (paymentModal) {
            paymentModal.addEventListener('click', (e) => {
                if (e.target === paymentModal) {
                    paymentModal.classList.remove('active');
                    this.resetPaymentModal();
                }
            });
        }
        
        // Payment option selection
        if (paymentOptions) {
            paymentOptions.forEach(option => {
                option.addEventListener('click', () => {
                    // Remove selected class from all options
                    paymentOptions.forEach(opt => opt.classList.remove('selected'));
                    
                    // Add selected class to clicked option
                    option.classList.add('selected');
                    
                    // Show payment details
                    if (paymentDetails) {
                        paymentDetails.style.display = 'block';
                    }
                    
                    // Focus on UPI pin input
                    if (upiPin) {
                        upiPin.focus();
                    }
                });
            });
        }
        
        // UPI PIN input handling
        if (upiPin) {
            upiPin.addEventListener('input', () => {
                // Enable process payment button when 6 digits are entered
                if (upiPin.value.length === 6) {
                    processPayment.disabled = false;
                } else {
                    processPayment.disabled = true;
                }
            });
        }
        
        // Process payment button
        if (processPayment) {
            processPayment.addEventListener('click', () => {
                this.processPayment();
            });
        }
    },
    
    // Reset payment modal to initial state
    resetPaymentModal: function() {
        const paymentOptions = document.querySelectorAll('.payment-option');
        const paymentDetails = document.querySelector('.payment-details');
        const upiPin = document.getElementById('upi-pin');
        const processPayment = document.getElementById('process-payment');
        
        // Reset selection
        if (paymentOptions) {
            paymentOptions.forEach(opt => opt.classList.remove('selected'));
        }
        
        // Hide payment details
        if (paymentDetails) {
            paymentDetails.style.display = 'none';
        }
        
        // Clear UPI PIN
        if (upiPin) {
            upiPin.value = '';
        }
        
        // Disable process button
        if (processPayment) {
            processPayment.disabled = true;
            processPayment.innerHTML = 'Pay Now';
        }
    },
    
    // Download bus pass
    downloadPass: async function(retryCount = 0) {
        if (!this.currentApplication || !this.currentApplication._id) {
            alert('No pass available to download');
            return;
        }
        try {
            const res = await fetch(`${API_BASE_URL}/student/pass/${this.currentApplication._id}/download`, {
                headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
            });
            const data = await res.json();
            if (!res.ok || !data.success || !data.passData) {
                if (retryCount < 3) {
                    // Wait 1 second and retry (up to 3 times)
                    setTimeout(() => this.downloadPass(retryCount + 1), 1000);
                    return;
                }
                alert((data && data.message) || 'Pass not available yet. Please try again in a few seconds.');
                return;
            }
            this.renderPassFromBackend(data.passData);
        } catch (err) {
            alert('Failed to download pass: ' + err.message);
        }
    },

    // Render pass using backend data and SVG template
    renderPassFromBackend: function(passData) {
        // Use correct relative path for SVG template
        fetch('/FRONTEND/assets/bus-pass-template.svg')
            .then(res => res.text())
            .then(svg => {
                // Replace all placeholders globally (in case they appear more than once)
                svg = svg.replace(/STUDENT_NAME/g, passData.studentName || '-')
                         .replace(/ROUTE_NAME/g, passData.route || '-')
                         .replace(/COLLEGE_ID/g, passData.collegeId || '-')
                         .replace(/START_DATE to END_DATE/g, `${new Date(passData.issueDate).toLocaleDateString()} to ${new Date(passData.expiryDate).toLocaleDateString()}`)
                         .replace(/PASS_ID/g, passData.passNumber || '-');
                // Debug: log passData to verify fields
                console.log('SVG passData:', passData);
                // Defensive: parse dates and pass number
                let issueDate = passData.issueDate ? new Date(passData.issueDate) : null;
                let expiryDate = passData.expiryDate ? new Date(passData.expiryDate) : null;
                let validity = (issueDate && !isNaN(issueDate.getTime()) && expiryDate && !isNaN(expiryDate.getTime()))
                    ? `${issueDate.toLocaleDateString()} to ${expiryDate.toLocaleDateString()}`
                    : '-';
                let passId = (typeof passData.passNumber === 'string' && passData.passNumber.trim() !== '') ? passData.passNumber : '-';
                svg = svg.replace(/START_DATE to END_DATE/g, validity)
                         .replace(/PASS_ID/g, passId);
                // Debug: log what is being inserted
                console.log('Validity:', validity, 'Pass ID:', passId, 'Raw passData:', passData);
                // Show SVG in a modal or trigger download
                const blob = new Blob([svg], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `bus-pass-${passData.studentName.replace(/\s+/g, '-')}.svg`;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 1000);
            });
    },
    
    // Generate bus pass HTML
    generatePassHTML: function() {
        // Calculate expiry date
        const durationMonths = parseInt(this.currentApplication.duration);
        const startDate = new Date(this.currentApplication.paymentDate || this.currentApplication.submittedDate);
        const expiryDate = new Date(startDate);
        expiryDate.setMonth(expiryDate.getMonth() + durationMonths);
        
        return `
            <div style="width: 600px; height: 400px; border: 10px solid #3498db; background-color: white; position: relative; font-family: Arial, sans-serif;">
                <div style="background-color: #3498db; color: white; padding: 15px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px;">STUDENT BUS PASS</h1>
                </div>
                
                <div style="padding: 20px;">
                    <div style="display: flex; justify-content: space-between;">
                        <div>
                            <p><strong>Student Name:</strong> ${auth.currentUser.name}</p>
                            <p><strong>Route:</strong> ${this.currentApplication.route}</p>
                            <p><strong>College ID:</strong> ${this.currentApplication.collegeId}</p>
                            <p><strong>Validity:</strong> ${startDate.toLocaleDateString()} to ${expiryDate.toLocaleDateString()}</p>
                            <p><strong>Pass ID:</strong> ${(this.currentApplication.pass && this.currentApplication.pass.passNumber) ? this.currentApplication.pass.passNumber : (this.currentApplication._id ? this.currentApplication._id.slice(0, 8).toUpperCase() : '-')}</p>
                        </div>
                        
                        <div style="border: 2px solid #2c3e50; width: 100px; height: 100px; display: flex; align-items: center; justify-content: center;">
                            <span>QR Code</span>
                        </div>
                    </div>
                </div>
                
                <div style="background-color: #3498db; color: white; padding: 10px; text-align: center; position: absolute; bottom: 0; width: 100%;">
                    <p style="margin: 0;">This pass is valid only with a student ID card.</p>
                </div>
            </div>
        `;
    },
    
    // Process payment for application (connects to backend endpoint)
    processPayment: async function() {
        if (!this.currentApplication || this.currentApplication.status !== 'payment_requested') {
            alert('No payment is required at this time.');
            return;
        }
        const processPayment = document.getElementById('process-payment');
        // Get selected payment method
        const selectedOption = document.querySelector('.payment-option.selected');
        if (!selectedOption) {
            alert('Please select a payment method.');
            return;
        }
        const paymentMethod = selectedOption.getAttribute('data-payment');
        // Use UPI PIN as a fake transactionId for demo (in real app, this would be a real transaction ID)
        const upiPin = document.getElementById('upi-pin').value;
        if (!upiPin || upiPin.length !== 6) {
            alert('Please enter your 6-digit UPI PIN.');
            return;
        }
        const transactionId = `TXN${Date.now()}${upiPin}`;
        if (processPayment) {
            processPayment.disabled = true;
            processPayment.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        }
        try {
            const res = await fetch(`${API_BASE_URL}/payments/process/${this.currentApplication._id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                },
                body: JSON.stringify({ paymentMethod, transactionId })
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || 'Payment failed');
            alert('Payment successful! Your pass is ready to download.');
            document.getElementById('payment-modal').classList.remove('active');
            this.resetPaymentModal();
            await this.loadCurrentApplication();
            this.updateDashboardUI();
        } catch (err) {
            alert('Failed to process payment: ' + err.message);
        } finally {
            if (processPayment) {
                processPayment.disabled = false;
                processPayment.innerHTML = 'Pay Now';
            }
        }
    }
};

// Initialize student dashboard
document.addEventListener('DOMContentLoaded', function() {
    studentDashboard.init();
});
