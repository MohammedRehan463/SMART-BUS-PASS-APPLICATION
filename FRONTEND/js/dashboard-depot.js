/**
 * Smart Bus Pass - Depot Officer Dashboard
 * Handles depot officer-specific functionality
 */

// Depot Officer Dashboard Controller
const depotDashboard = {
    // Store applications data
    applications: [],
    
    // Current selected application
    selectedApplication: null,
    
    // Canvas and context for document editing
    canvas: null,
    ctx: null,
    
    // Initialize depot dashboard
    init: function() {
        // Check if user role is depot officer
        if (!auth.currentUser || auth.currentUser.role !== 'depot') {
            window.location.href = 'login.html';
            return;
        }
        
        // Load applications data
        this.loadApplications();
        
        // Initialize dashboard tabs
        this.initDashboardTab();
        this.initPendingTab();
        this.initProcessedTab();
        this.initCompletedTab();
        this.initHistoryTab();
        
        // Initialize review modal
        this.initReviewModal();
        
        // Initialize pass view modal
        this.initPassModal();
    },
    
    // Fetch admin approved applications from backend
    fetchAdminApprovedApplications: async function() {
        const res = await fetch(`${API_BASE_URL}/depot/admin-approved`, {
            headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
        });
        const data = await res.json();
        return data.applications || [];
    },
    // Fetch payment requested applications from backend
    fetchPaymentRequestedApplications: async function() {
        const res = await fetch(`${API_BASE_URL}/depot/payment-requested`, {
            headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
        });
        const data = await res.json();
        return data.applications || [];
    },
    // Fetch completed applications from backend
    fetchCompletedApplications: async function() {
        const res = await fetch(`${API_BASE_URL}/depot/completed`, {
            headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
        });
        const data = await res.json();
        return data.applications || [];
    },
    // Fetch depot stats from backend
    fetchDepotStats: async function() {
        const res = await fetch(`${API_BASE_URL}/depot/stats`, {
            headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
        });
        const data = await res.json();
        return data.stats || {};
    },
    // Fetch depot history from backend
    fetchDepotHistory: async function() {
        const res = await fetch(`${API_BASE_URL}/depot/history`, {
            headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
        });
        const data = await res.json();
        return data.activities || data.history || [];
    },

    // Load applications data (from backend only)
    loadApplications: async function() {
        const [adminApproved, paymentRequested, completed] = await Promise.all([
            this.fetchAdminApprovedApplications(),
            this.fetchPaymentRequestedApplications(),
            this.fetchCompletedApplications()
        ]);
        this.adminApprovedApplications = adminApproved;
        this.paymentRequestedApplications = paymentRequested;
        this.completedApplications = completed;
        await this.updateDashboardStats();
        this.populateRecentApplications();
        this.populateAdminApprovedApplications();
        this.populatePaymentRequestedApplications();
        this.populateCompletedApplications();
    },
    
    // Update dashboard statistics (use backend data)
    updateDashboardStats: async function() {
        const stats = await this.fetchDepotStats();
        const adminApprovedCount = document.getElementById('admin-approved-count');
        const paymentRequestedCount = document.getElementById('payment-requested-count');
        const completedCount = document.getElementById('completed-count');
        if (adminApprovedCount) adminApprovedCount.textContent = stats.adminApproved || 0;
        if (paymentRequestedCount) paymentRequestedCount.textContent = stats.paymentRequested || 0;
        if (completedCount) completedCount.textContent = stats.completed || 0;
    },
    
    // Initialize dashboard tab
    initDashboardTab: function() {
        // No specific initialization needed beyond the common tab system
    },
    
    // Populate recent applications table (use all backend arrays, sort by date)
    populateRecentApplications: function() {
        const recentBody = document.getElementById('recent-applications-body');
        const noRecent = document.getElementById('no-recent');
        // Merge all backend-fetched arrays
        const allApps = [
            ...(this.adminApprovedApplications || []),
            ...(this.paymentRequestedApplications || []),
            ...(this.completedApplications || [])
        ];
        // Sort by last updated/created date (descending)
        const recentApplications = allApps
            .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
            .slice(0, 5);
        if (recentApplications.length === 0) {
            if (recentBody) recentBody.innerHTML = '';
            if (noRecent) noRecent.style.display = 'block';
            return;
        }
        if (noRecent) noRecent.style.display = 'none';
        if (recentBody) {
            recentBody.innerHTML = recentApplications.map(app => `
                <tr>
                    <td>${(app.student && app.student.name) || '-'}</td>
                    <td>${app.applicationType === 'new' ? 'New Pass' : (app.applicationType === 'renewal' ? 'Renewal' : '-')}</td>
                    <td>${app.route || '-'}</td>
                    <td><span class="status status-${this.getStatusClass(app.status)}">${app.status}</span></td>
                    <td>
                        <div class="action-btns">
                            <button class="action-btn view-btn" data-id="${app._id}"><i class="fas fa-eye"></i> View</button>
                            ${app.status === 'admin_approved' ? `
                                <button class="action-btn approve-btn" data-id="${app._id}"><i class="fas fa-credit-card"></i> Request Payment</button>
                            ` : ''}
                            ${app.status === 'payment_completed' ? `
                                <button class="action-btn view-pass-btn" data-id="${app._id}"><i class="fas fa-id-card"></i> View Pass</button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `).join('');
            this.addRecentTableEventListeners(recentBody);
        }
    },
    
    // Add event listeners to recent table buttons
    addRecentTableEventListeners: function(tableBody) {
        // View button
        const viewButtons = tableBody.querySelectorAll('.view-btn');
        viewButtons.forEach(button => {
            button.addEventListener('click', () => {
                const appId = button.getAttribute('data-id');
                this.openReviewModal(appId, 'view');
            });
        });
        
        // Request payment button
        const approveButtons = tableBody.querySelectorAll('.approve-btn');
        approveButtons.forEach(button => {
            button.addEventListener('click', () => {
                const appId = button.getAttribute('data-id');
                this.openReviewModal(appId, 'request');
            });
        });
        
        // View pass button
        const viewPassButtons = tableBody.querySelectorAll('.view-pass-btn');
        viewPassButtons.forEach(button => {
            button.addEventListener('click', () => {
                const appId = button.getAttribute('data-id');
                this.openPassModal(appId);
            });
        });
    },
    
    // Initialize pending tab (admin approved applications)
    initPendingTab: function() {
        // No specific initialization needed beyond the data population
    },
    
    // Populate admin approved applications table (use backend data)
    populateAdminApprovedApplications: function() {
        const adminApprovedBody = document.getElementById('admin-approved-applications-body');
        const noAdminApproved = document.getElementById('no-admin-approved');
        const adminApprovedApplications = this.adminApprovedApplications || [];
        if (adminApprovedApplications.length === 0) {
            if (adminApprovedBody) adminApprovedBody.innerHTML = '';
            if (noAdminApproved) noAdminApproved.style.display = 'block';
            return;
        }
        if (noAdminApproved) noAdminApproved.style.display = 'none';
        if (adminApprovedBody) {
            adminApprovedBody.innerHTML = adminApprovedApplications.map(app => `
                <tr>
                    <td>${app.student && app.student.name || '-'}</td>
                    <td>${app.applicationType === 'new' ? 'New Pass' : 'Renewal'}</td>
                    <td>${app.route}</td>
                    <td>${app.duration} month${app.duration > 1 ? 's' : ''}</td>
                    <td>${app.adminReview && app.adminReview.admin && app.adminReview.admin.name || '-'}</td>
                    <td>${dashboardCommon.formatDate(app.adminReview && app.adminReview.date)}</td>
                    <td>
                        <div class="action-btns">
                            <button class="action-btn view-btn" data-id="${app._id}"><i class="fas fa-eye"></i> View</button>
                            <button class="action-btn approve-btn" data-id="${app._id}"><i class="fas fa-credit-card"></i> Request Payment</button>
                        </div>
                    </td>
                </tr>
            `).join('');
            // Add event listeners to action buttons
            const viewButtons = adminApprovedBody.querySelectorAll('.view-btn');
            const approveButtons = adminApprovedBody.querySelectorAll('.approve-btn');
            viewButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const appId = button.getAttribute('data-id');
                    this.openReviewModal(appId, 'view');
                });
            });
            approveButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const appId = button.getAttribute('data-id');
                    this.openReviewModal(appId, 'request');
                });
            });
        }
    },
    
    // Initialize processed tab (payment requested applications)
    initProcessedTab: function() {
        // No specific initialization needed beyond the data population
    },
    
    // Populate payment requested applications table (use backend data)
    populatePaymentRequestedApplications: function() {
        const paymentRequestedBody = document.getElementById('payment-requested-applications-body');
        const noPaymentRequested = document.getElementById('no-payment-requested');
        const paymentRequestedApplications = this.paymentRequestedApplications || [];
        if (paymentRequestedApplications.length === 0) {
            if (paymentRequestedBody) paymentRequestedBody.innerHTML = '';
            if (noPaymentRequested) noPaymentRequested.style.display = 'block';
            return;
        }
        if (noPaymentRequested) noPaymentRequested.style.display = 'none';
        if (paymentRequestedBody) {
            paymentRequestedBody.innerHTML = paymentRequestedApplications.map(app => `
                <tr>
                    <td>${app.student && app.student.name || '-'}</td>
                    <td>${app.applicationType === 'new' ? 'New Pass' : 'Renewal'}</td>
                    <td>${app.route}</td>
                    <td>${app.duration} month${app.duration > 1 ? 's' : ''}</td>
                    <td>${dashboardCommon.formatDate(app.payment && app.payment.date)}</td>
                    <td><span class="status status-payment">Pending</span></td>
                    <td>
                        <div class="action-btns">
                            <button class="action-btn view-btn" data-id="${app._id}"><i class="fas fa-eye"></i> View</button>
                        </div>
                    </td>
                </tr>
            `).join('');
            const viewButtons = paymentRequestedBody.querySelectorAll('.view-btn');
            viewButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const appId = button.getAttribute('data-id');
                    this.openReviewModal(appId, 'view');
                });
            });
        }
    },
    
    // Initialize completed tab
    initCompletedTab: function() {
        // No specific initialization needed beyond the data population
    },
    
    // Populate completed applications table (use backend data)
    populateCompletedApplications: function() {
        const completedBody = document.getElementById('completed-applications-body');
        const noCompleted = document.getElementById('no-completed');
        const completedApplications = this.completedApplications || [];
        if (completedApplications.length === 0) {
            if (completedBody) completedBody.innerHTML = '';
            if (noCompleted) noCompleted.style.display = 'block';
            return;
        }
        if (noCompleted) noCompleted.style.display = 'none';
        if (completedBody) {
            completedBody.innerHTML = completedApplications.map(app => `
                <tr>
                    <td>${app.student && app.student.name || '-'}</td>
                    <td>${app.applicationType === 'new' ? 'New Pass' : 'Renewal'}</td>
                    <td>${app.route}</td>
                    <td>${app.duration} month${app.duration > 1 ? 's' : ''}</td>
                    <td>${dashboardCommon.formatDate(app.payment && app.payment.date)}</td>
                    <td>
                        <div class="action-btns">
                            <button class="action-btn view-btn" data-id="${app._id}"><i class="fas fa-eye"></i> View</button>
                        </div>
                    </td>
                </tr>
            `).join('');
            const viewButtons = completedBody.querySelectorAll('.view-btn');
            viewButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const appId = button.getAttribute('data-id');
                    this.openReviewModal(appId, 'view');
                });
            });
        }
    },
    
    // Initialize history tab
    initHistoryTab: function() {
        this.loadHistory();
    },
    
    // Load and display depot officer history from backend
    loadHistory: async function() {
        const historyBody = document.getElementById('history-body');
        const noHistory = document.getElementById('no-history');
        if (historyBody) historyBody.innerHTML = '';
        if (noHistory) noHistory.style.display = 'none';
        try {
            const history = await this.fetchDepotHistory();
            if (!history || history.length === 0) {
                if (noHistory) noHistory.style.display = 'block';
                return;
            }
            if (historyBody) {
                historyBody.innerHTML = history.map(entry => `
                    <tr>
                        <td>${dashboardCommon.formatDate(entry.date || entry.createdAt)}</td>
                        <td>${entry.action || entry.type || '-'}</td>
                        <td>${entry.studentName || (entry.application && entry.application.studentName) || '-'}</td>
                        <td>${entry.details || '-'}</td>
                    </tr>
                `).join('');
            }
        } catch (err) {
            if (noHistory) noHistory.style.display = 'block';
            if (historyBody) historyBody.innerHTML = '<tr><td colspan="4">Failed to load history</td></tr>';
        }
    },
    
    // Initialize review modal
    initReviewModal: function() {
        // Get modal elements
        const reviewModal = document.getElementById('review-modal');
        const closeModalBtn = document.getElementById('close-review-modal');
        const cancelReviewBtn = document.getElementById('cancel-review');
        const requestPaymentBtn = document.getElementById('request-payment');
        const pricingSelect = document.getElementById('pricing');
        const customPriceGroup = document.getElementById('custom-price-group');
        const addDepotStampBtn = document.getElementById('add-depot-stamp-btn');
        const addRouteNoteBtn = document.getElementById('add-route-note-btn');
        const documentCanvas = document.getElementById('document-canvas');
        
        // Store canvas and context
        if (documentCanvas) {
            this.canvas = documentCanvas;
            this.ctx = documentCanvas.getContext('2d');
        }
        
        // Close modal buttons
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                reviewModal.classList.remove('active');
            });
        }
        
        if (cancelReviewBtn) {
            cancelReviewBtn.addEventListener('click', () => {
                reviewModal.classList.remove('active');
            });
        }
        
        // Close modal when clicking outside
        if (reviewModal) {
            reviewModal.addEventListener('click', (e) => {
                if (e.target === reviewModal) {
                    reviewModal.classList.remove('active');
                }
            });
        }
        
        // Pricing select change handler
        if (pricingSelect) {
            pricingSelect.addEventListener('change', () => {
                const pricing = pricingSelect.value;
                
                // Toggle custom price input
                if (customPriceGroup) {
                    customPriceGroup.style.display = pricing === 'custom' ? 'block' : 'none';
                }
                
                // Enable request payment button if pricing is selected
                if (requestPaymentBtn) {
                    requestPaymentBtn.disabled = pricing === '';
                }
            });
        }
        
        // Add depot stamp button
        if (addDepotStampBtn) {
            addDepotStampBtn.addEventListener('click', () => {
                this.canvas.style.display = 'block';
                this.initializeCanvas();
                this.addDepotStamp();
            });
        }
        
        // Add route note button
        if (addRouteNoteBtn) {
            addRouteNoteBtn.addEventListener('click', () => {
                this.canvas.style.display = 'block';
                this.initializeCanvas();
                this.addRouteNote();
            });
        }
        
        // Request payment button
        if (requestPaymentBtn) {
            requestPaymentBtn.addEventListener('click', () => {
                this.requestPayment();
            });
        }
    },
    
    // Open review modal
    openReviewModal: function(applicationId, action = 'view') {
        // Find application in all backend-fetched arrays
        let application = (this.adminApprovedApplications || []).find(app => app._id === applicationId)
            || (this.paymentRequestedApplications || []).find(app => app._id === applicationId)
            || (this.completedApplications || []).find(app => app._id === applicationId);
        if (!application) {
            alert('Application not found');
            return;
        }
        this.selectedApplication = application;
        // Get modal elements
        const reviewModal = document.getElementById('review-modal');
        const modalTitle = document.querySelector('.modal-title');
        const pricingSelect = document.getElementById('pricing');
        const pricingGroup = pricingSelect?.parentElement;
        const customPriceGroup = document.getElementById('custom-price-group');
        const passNotesGroup = document.getElementById('pass-notes')?.parentElement;
        const documentModifyGroup = document.getElementById('add-depot-stamp-btn')?.parentElement.parentElement;
        const requestPaymentBtn = document.getElementById('request-payment');
        // Set modal title based on action and status
        if (modalTitle) {
            if (action === 'view') {
                modalTitle.textContent = 'View Application';
            } else {
                modalTitle.textContent = 'Process Application';
            }
        }
        // Robustly extract student info from backend structure
        const student = application.student || {};
        document.getElementById('modal-student-name').textContent = student.name || application.studentName || '-';
        document.getElementById('modal-student-email').textContent = student.email || application.studentEmail || '-';
        document.getElementById('modal-application-type').textContent = application.applicationType === 'new' ? 'New Pass' : (application.applicationType === 'renewal' ? 'Renewal' : '-');
        document.getElementById('modal-route').textContent = application.route || '-';
        document.getElementById('modal-college-id').textContent = application.collegeId || '-';
        document.getElementById('modal-duration').textContent = application.duration || '-';
        document.getElementById('modal-approved-date').textContent = application.adminReview && application.adminReview.date ? dashboardCommon.formatDate(application.adminReview.date) : 'N/A';
        // Set ID proof image (use stamped document if available)
        const idProofImg = document.getElementById('modal-id-proof');
        const stampOverlayImg = document.getElementById('modal-stamp-overlay');
        let idProofPath = application.idProof || (student && student.idProof);
        let stampPath = application.stampedDocument;
        // Set main ID proof image
        if (idProofImg && idProofPath) {
            let src = idProofPath.replace(/^\/+/, '');
            if (!src.startsWith('http')) {
                if (src.startsWith('uploads/')) {
                    src = `${API_BASE_URL.replace(/\/api$/, '')}/${src}`;
                } else {
                    src = `${API_BASE_URL.replace(/\/api$/, '')}/uploads/${src}`;
                }
            }
            idProofImg.src = src;
        }
        // Set stamp/signature overlay ONLY if stampedDocument exists and is different from idProof
        if (stampOverlayImg && stampPath) {
            let stampSrc = stampPath.replace(/^\/+/, '');
            if (!stampSrc.startsWith('http')) {
                if (stampSrc.startsWith('uploads/')) {
                    stampSrc = `${API_BASE_URL.replace(/\/api$/, '')}/${stampSrc}`;
                } else {
                    stampSrc = `${API_BASE_URL.replace(/\/api$/, '')}/uploads/${stampSrc}`;
                }
            }
            stampOverlayImg.src = stampSrc;
            stampOverlayImg.style.display = 'block';
        } else if (stampOverlayImg) {
            stampOverlayImg.style.display = 'none';
        }
        // Show/hide action elements based on action and status
        if (pricingGroup) pricingGroup.style.display = action === 'request' ? 'block' : 'none';
        if (customPriceGroup) customPriceGroup.style.display = 'none';
        if (passNotesGroup) passNotesGroup.style.display = action === 'request' ? 'block' : 'none';
        if (documentModifyGroup) documentModifyGroup.style.display = action === 'request' ? 'block' : 'none';
        if (requestPaymentBtn) requestPaymentBtn.style.display = action === 'request' ? 'block' : 'none';
        // Reset form
        if (pricingSelect) pricingSelect.value = '';
        if (document.getElementById('pass-notes')) document.getElementById('pass-notes').value = '';
        if (this.canvas) this.canvas.style.display = 'none';
        if (requestPaymentBtn) requestPaymentBtn.disabled = true;
        // Show modal
        reviewModal.classList.add('active');
    },
    
    // Initialize canvas for document editing
    initializeCanvas: function() {
        if (!this.canvas || !this.ctx) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw document preview (simplified version of ID card)
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.strokeStyle = '#cccccc';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(10, 10, this.canvas.width - 20, this.canvas.height - 20);
        
        // Draw instructions
        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = '#666666';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Click "Add Depot Stamp" or "Add Route Details" buttons above', this.canvas.width / 2, 100);
    },
    
    // Add depot stamp to canvas
    addDepotStamp: function() {
        if (!this.canvas || !this.ctx) return;
        
        // Draw stamp (square seal)
        const centerX = this.canvas.width * 0.75;
        const centerY = this.canvas.height * 0.5;
        const size = 80;
        
        // Draw outer square
        this.ctx.strokeStyle = '#e67e22';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(centerX - size/2, centerY - size/2, size, size);
        
        // Draw inner square
        this.ctx.strokeStyle = '#e67e22';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(centerX - size/2 + 10, centerY - size/2 + 10, size - 20, size - 20);
        
        // Draw text
        this.ctx.font = 'bold 10px Arial';
        this.ctx.fillStyle = '#e67e22';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('DEPOT OFFICER', centerX, centerY - 20);
        this.ctx.fillText('VERIFICATION', centerX, centerY - 5);
        this.ctx.fillText('SMART BUS PASS', centerX, centerY + 10);
        
        // Draw date
        const date = new Date().toLocaleDateString();
        this.ctx.font = '10px Arial';
        this.ctx.fillText(date, centerX, centerY + 30);
        
        // Draw officer name
        this.ctx.font = '10px Arial';
        this.ctx.fillText(auth.currentUser.name, centerX, centerY + 45);
    },
    
    // Add route note to canvas
    addRouteNote: function() {
        if (!this.canvas || !this.ctx) return;
        
        // Draw route note box
        const startX = this.canvas.width * 0.1;
        const startY = this.canvas.height * 0.7;
        const width = this.canvas.width * 0.8;
        const height = 60;
        
        // Draw box
        this.ctx.fillStyle = 'rgba(230, 126, 34, 0.1)';
        this.ctx.fillRect(startX, startY, width, height);
        this.ctx.strokeStyle = '#e67e22';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(startX, startY, width, height);
        
        // Draw title
        this.ctx.font = 'bold 12px Arial';
        this.ctx.fillStyle = '#e67e22';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('ROUTE DETAILS:', startX + 10, startY + 15);
        
        // Draw route information
        this.ctx.font = '11px Arial';
        this.ctx.fillStyle = '#333333';
        
        // Get route from selected application
        const route = this.selectedApplication ? this.selectedApplication.route : 'Unknown';
        
        // Draw route details
        this.ctx.fillText(`Route: ${route}`, startX + 10, startY + 35);
        this.ctx.fillText(`Valid for all buses on this route`, startX + 10, startY + 50);
    },
    
    // Request payment for application (connects to backend endpoint)
    requestPayment: async function() {
        if (!this.selectedApplication) {
            alert('No application selected');
            return;
        }
        const pricing = document.getElementById('pricing').value;
        const customPrice = document.getElementById('custom-price').value;
        const passNotes = document.getElementById('pass-notes').value;
        if (pricing === '') {
            alert('Please select a pricing option');
            return;
        }
        if (pricing === 'custom' && (!customPrice || customPrice < 100)) {
            alert('Please enter a valid custom price (minimum ₹100)');
            return;
        }
        let pricePerMonth = 0;
        let priceDescription = '';
        switch (pricing) {
            case 'student-city':
                pricePerMonth = 150;
                priceDescription = 'Student City Pass';
                break;
            case 'student-suburban':
                pricePerMonth = 250;
                priceDescription = 'Student Suburban Pass';
                break;
            case 'student-express':
                pricePerMonth = 350;
                priceDescription = 'Student Express Pass';
                break;
            case 'custom':
                pricePerMonth = parseInt(customPrice);
                priceDescription = 'Custom Pass';
                break;
        }
        // Calculate total price based on duration
        const totalPrice = pricePerMonth * parseInt(this.selectedApplication.duration);
        // Get canvas image if modified
        let stampedDocumentFile = null;
        if (this.canvas && this.canvas.style.display !== 'none') {
            // Convert canvas to blob for upload
            const dataUrl = this.canvas.toDataURL('image/png');
            const arr = dataUrl.split(','), mime = arr[0].match(/:(.*?);/)[1], bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
            for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i);
            stampedDocumentFile = new File([u8arr], 'stampedDocument.png', { type: mime });
        }
        // Prepare form data
        const formData = new FormData();
        formData.append('priceCategory', pricing);
        formData.append('price', pricePerMonth);
        formData.append('notes', passNotes);
        if (stampedDocumentFile) {
            formData.append('stampedDocument', stampedDocumentFile);
        }
        // Disable button and show loading
        const requestPaymentBtn = document.getElementById('request-payment');
        if (requestPaymentBtn) {
            requestPaymentBtn.disabled = true;
            requestPaymentBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Requesting...';
        }
        try {
            const res = await fetch(`${API_BASE_URL}/depot/request-payment/${this.selectedApplication._id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
                body: formData
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || 'Failed to request payment');
            alert('Payment request sent successfully!');
            document.getElementById('review-modal').classList.remove('active');
            this.loadApplications();
        } catch (err) {
            alert('Failed to request payment: ' + err.message);
        } finally {
            if (requestPaymentBtn) {
                requestPaymentBtn.disabled = false;
                requestPaymentBtn.innerHTML = 'Request Payment';
            }
        }
    },
    
    // Initialize pass view modal
    initPassModal: function() {
        const passModal = document.getElementById('pass-modal');
        const closePassModal = document.getElementById('close-pass-modal');
        const closePassView = document.getElementById('close-pass-view');
        
        // Close modal buttons
        if (closePassModal) {
            closePassModal.addEventListener('click', () => {
                passModal.classList.remove('active');
            });
        }
        
        if (closePassView) {
            closePassView.addEventListener('click', () => {
                passModal.classList.remove('active');
            });
        }
        
        // Close modal when clicking outside
        if (passModal) {
            passModal.addEventListener('click', (e) => {
                if (e.target === passModal) {
                    passModal.classList.remove('active');
                }
            });
        }
    },
    
    // Open pass view modal (search all backend-fetched arrays)
    openPassModal: function(applicationId) {
        // Find application in all backend-fetched arrays
        let application = (this.adminApprovedApplications || []).find(app => app._id === applicationId)
            || (this.paymentRequestedApplications || []).find(app => app._id === applicationId)
            || (this.completedApplications || []).find(app => app._id === applicationId);
        if (!application) {
            alert('Application not found');
            return;
        }
        // Verify that application has payment done or is completed
        if (application.status !== 'completed' && application.status !== 'payment_completed') {
            alert('Pass is not available yet. Payment has not been completed.');
            return;
        }
        // Get pass container
        const passContainer = document.getElementById('pass-container');
        // Generate pass HTML
        if (passContainer) {
            passContainer.innerHTML = this.generatePassHTML(application);
        }
        // Show modal
        document.getElementById('pass-modal').classList.add('active');
    },
    
    // Generate bus pass HTML
    generatePassHTML: function(application) {
        // Calculate expiry date
        const durationMonths = parseInt(application.duration);
        const startDate = new Date(application.paymentDate || application.submittedDate);
        const expiryDate = new Date(startDate);
        expiryDate.setMonth(expiryDate.getMonth() + durationMonths);
        
        return `
            <div style="width: 400px; height: 250px; border: 5px solid #e67e22; background-color: white; position: relative; font-family: Arial, sans-serif; margin: 0 auto;">
                <div style="background-color: #e67e22; color: white; padding: 10px; text-align: center;">
                    <h2 style="margin: 0; font-size: 18px;">STUDENT BUS PASS</h2>
                    <p style="margin: 0; font-size: 12px;">${application.priceDescription || 'Standard Pass'}</p>
                </div>
                
                <div style="padding: 15px;">
                    <div style="display: flex; justify-content: space-between;">
                        <div style="width: 65%;">
                            <p style="margin: 5px 0; font-size: 14px;"><strong>Student:</strong> ${application.studentName}</p>
                            <p style="margin: 5px 0; font-size: 14px;"><strong>Route:</strong> ${application.route}</p>
                            <p style="margin: 5px 0; font-size: 14px;"><strong>College ID:</strong> ${application.collegeId}</p>
                            <p style="margin: 5px 0; font-size: 14px;"><strong>Valid from:</strong> ${startDate.toLocaleDateString()}</p>
                            <p style="margin: 5px 0; font-size: 14px;"><strong>Valid until:</strong> ${expiryDate.toLocaleDateString()}</p>
                            <p style="margin: 5px 0; font-size: 14px;"><strong>Pass ID:</strong> ${application.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                        
                        <div style="width: 30%; text-align: center;">
                            <div style="border: 2px solid #333; width: 80px; height: 80px; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 12px;">QR Code</span>
                            </div>
                            <p style="margin: 5px 0; font-size: 12px;">Scan for verification</p>
                        </div>
                    </div>
                    
                    ${application.passNotes ? `
                    <div style="margin-top: 10px; border-top: 1px dashed #ccc; padding-top: 10px;">
                        <p style="margin: 0; font-size: 12px;"><strong>Notes:</strong> ${application.passNotes}</p>
                    </div>
                    ` : ''}
                </div>
                
                <div style="background-color: #e67e22; color: white; padding: 5px; text-align: center; position: absolute; bottom: 0; width: 100%; font-size: 12px;">
                    <p style="margin: 0;">This pass must be presented with a valid student ID</p>
                </div>
            </div>
        `;
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
    }
};

// Initialize depot dashboard
document.addEventListener('DOMContentLoaded', function() {
    depotDashboard.init();
});
