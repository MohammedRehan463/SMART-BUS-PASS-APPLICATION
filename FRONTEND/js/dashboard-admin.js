/**
 * Smart Bus Pass - Admin Dashboard
 * Handles admin-specific functionality
 */

// Admin Dashboard Controller
const adminDashboard = {
    // Store applications data
    applications: [],
    
    // Current selected application
    selectedApplication: null,
    
    // Canvas and context for document editing
    canvas: null,
    ctx: null,
    
    // Initialize admin dashboard
    init: function() {
        // Check if user role is admin
        if (!auth.currentUser || auth.currentUser.role !== 'admin') {
            window.location.href = 'login.html';
            return;
        }
        
        // Load applications data
        this.loadApplications();
        
        // Initialize dashboard tabs
        this.initDashboardTab();
        this.initPendingTab();
        this.initProcessedTab();
        this.initHistoryTab();
        
        // Initialize review modal
        this.initReviewModal();
    },
    
    // Load applications data
    loadApplications: async function() {
        // Fetch pending and processed applications from backend
        const pending = await adminDashboard.fetchPendingApplications();
        const processed = await adminDashboard.fetchProcessedApplications();
        this.applications = [...(pending || []), ...(processed || [])];
        await this.updateDashboardStats();
        this.populateRecentApplications();
        this.populatePendingApplications();
        this.populateProcessedApplications();
    },

    // Fetch pending applications from backend
    fetchPendingApplications: async function() {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/pending`, {
                headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
            });
            if (!res.ok) throw new Error('Failed to fetch pending applications');
            const data = await res.json();
            this.pendingApplications = Array.isArray(data.applications) ? data.applications : [];
            return this.pendingApplications;
        } catch (err) {
            this.pendingApplications = [];
            return [];
        }
    },

    // Fetch processed applications from backend
    fetchProcessedApplications: async function() {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/processed`, {
                headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
            });
            if (!res.ok) throw new Error('Failed to fetch processed applications');
            const data = await res.json();
            this.processedApplications = Array.isArray(data.applications) ? data.applications : [];
            return this.processedApplications;
        } catch (err) {
            this.processedApplications = [];
            return [];
        }
    },

    // Fetch application details from backend
    fetchApplicationById: async function(appId) {
        try {
            const res = await fetch(`${API_BASE_URL}/applications/${appId}`, {
                headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
            });
            if (!res.ok) throw new Error('Failed to fetch application details');
            const data = await res.json();
            // Always return the application object directly
            return data.application || data;
        } catch (err) {
            alert('Error fetching application details: ' + err.message);
            return null;
        }
    },

    // Update dashboard statistics from backend
    updateDashboardStats: async function() {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/stats`, {
                headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
            });
            if (!res.ok) throw new Error('Failed to fetch admin stats');
            const data = await res.json();
            // Use correct structure: data.stats.{pending,approved,rejected}
            const pendingCount = document.getElementById('pending-count');
            const approvedCount = document.getElementById('approved-count');
            const rejectedCount = document.getElementById('rejected-count');
            if (pendingCount) pendingCount.textContent = (data.stats && typeof data.stats.pending === 'number') ? data.stats.pending : 0;
            if (approvedCount) approvedCount.textContent = (data.stats && typeof data.stats.approved === 'number') ? data.stats.approved : 0;
            if (rejectedCount) rejectedCount.textContent = (data.stats && typeof data.stats.rejected === 'number') ? data.stats.rejected : 0;
        } catch (err) {
            // Optionally show error
        }
    },
    
    // Initialize dashboard tab
    initDashboardTab: function() {
        // No specific initialization needed beyond the common tab system
    },
    
    // Populate recent applications table
    populateRecentApplications: function() {
        const recentBody = document.getElementById('recent-applications-body');
        const noRecent = document.getElementById('no-recent');
        const recentApplications = [...this.applications]
            .sort((a, b) => (b.lastUpdated || b.createdAt) - (a.lastUpdated || a.createdAt))
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
                    <td>${app.studentName || (app.student && app.student.name) || '-'}</td>
                    <td>${app.applicationType}</td>
                    <td>${dashboardCommon.formatDate(app.createdAt)}</td>
                    <td><span class="status status-${this.getStatusClass(app.status)}">${app.status}</span></td>
                    <td><div class="action-btns"><button class="action-btn view-btn" data-id="${app._id}"><i class="fas fa-eye"></i> View</button></div></td>
                </tr>
            `).join('');
            // Add event listeners to view buttons
            const viewButtons = recentBody.querySelectorAll('.view-btn');
            viewButtons.forEach(button => {
                button.addEventListener('click', async () => {
                    const appId = button.getAttribute('data-id');
                    const appDetails = await this.fetchApplicationById(appId);
                    if (appDetails) this.openReviewModal(appDetails);
                });
            });
        }
    },
    
    // Initialize pending tab
    initPendingTab: function() {
        // No specific initialization needed beyond the data population
    },
    
    // Populate pending applications table
    populatePendingApplications: function() {
        const pendingBody = document.getElementById('pending-applications-body');
        const noPending = document.getElementById('no-pending');
        const pendingApplications = this.pendingApplications || [];
        if (pendingApplications.length === 0) {
            if (pendingBody) pendingBody.innerHTML = '';
            if (noPending) noPending.style.display = 'block';
            return;
        }
        if (noPending) noPending.style.display = 'none';
        if (pendingBody) {
            pendingBody.innerHTML = pendingApplications.map(app => `
                <tr>
                    <td>${app.studentName || (app.student && app.student.name) || '-'}</td>
                    <td>${app.route}</td>
                    <td>${app.applicationType}</td>
                    <td>${dashboardCommon.formatDate(app.createdAt)}</td>
                    <td>${app.status}</td>
                    <td>
                        <button class="action-btn approve-btn" data-id="${app._id}"><i class="fas fa-check"></i> Approve</button>
                        <button class="action-btn reject-btn" data-id="${app._id}"><i class="fas fa-times"></i> Reject</button>
                        <button class="action-btn view-btn" data-id="${app._id}"><i class="fas fa-eye"></i> View</button>
                    </td>
                </tr>
            `).join('');
        }
        // Add event listeners to action buttons
        const viewButtons = pendingBody.querySelectorAll('.view-btn');
        const approveButtons = pendingBody.querySelectorAll('.approve-btn');
        const rejectButtons = pendingBody.querySelectorAll('.reject-btn');
        // View button
        viewButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const appId = button.getAttribute('data-id');
                const appDetails = await this.fetchApplicationById(appId);
                if (appDetails) this.openReviewModal(appDetails);
            });
        });
        // Approve button
        approveButtons.forEach(button => {
            button.addEventListener('click', () => {
                const appId = button.getAttribute('data-id');
                this.openReviewModal(appId, 'approve');
            });
        });
        // Reject button
        rejectButtons.forEach(button => {
            button.addEventListener('click', () => {
                const appId = button.getAttribute('data-id');
                this.openReviewModal(appId, 'reject');
            });
        });
        // Update pending count
        const pendingCount = document.getElementById('pending-count');
        if (pendingCount) pendingCount.textContent = pendingApplications.length;
    },
    
    // Initialize processed tab
    initProcessedTab: function() {
        // No specific initialization needed beyond the data population
    },
    
    // Populate processed applications tables
    populateProcessedApplications: function() {
        const approvedBody = document.getElementById('approved-applications-body');
        const rejectedBody = document.getElementById('rejected-applications-body');
        const noApproved = document.getElementById('no-approved');
        const noRejected = document.getElementById('no-rejected');
        const processedApplications = this.processedApplications || [];
        // DEBUG: Log processed applications to help diagnose missing approved apps
        console.log('Processed Applications:', processedApplications);
        // Also log all statuses for diagnosis
        processedApplications.forEach(app => {
            console.log('App ID:', app._id, 'Status:', app.status);
        });
        const approvedAppsDebug = processedApplications.filter(app => {
            // Log the status for each app
            console.log('Checking app for approved:', app._id, app.status);
            return app.status && app.status.toLowerCase() === 'admin_approved';
        });
        console.log('Filtered Approved Applications:', approvedAppsDebug);
        if (approvedBody) {
            const approvedApps = processedApplications.filter(app => app.status === 'admin_approved');
            if (approvedApps.length === 0) {
                approvedBody.innerHTML = '';
                if (noApproved) noApproved.style.display = 'block';
            } else {
                if (noApproved) noApproved.style.display = 'none';
                approvedBody.innerHTML = approvedApps.map(app => `
                    <tr>
                        <td>${app.studentName || (app.student && app.student.name) || '-'}</td>
                        <td>${app.applicationType}</td>
                        <td>${app.route}</td>
                        <td>${dashboardCommon.formatDate(app.adminReview && app.adminReview.date ? app.adminReview.date : app.updatedAt)}</td>
                        <td><button class="action-btn view-btn" data-id="${app._id}"><i class="fas fa-eye"></i> View</button></td>
                    </tr>
                `).join('');
                // Add event listeners to view buttons
                const viewButtons = approvedBody.querySelectorAll('.view-btn');
                viewButtons.forEach(button => {
                    button.addEventListener('click', async () => {
                        const appId = button.getAttribute('data-id');
                        const appDetails = await this.fetchApplicationById(appId);
                        if (appDetails) this.openReviewModal(appDetails);
                    });
                });
            }
        }
        if (rejectedBody) {
            const rejectedApps = processedApplications.filter(app => app.status === 'admin_rejected');
            if (rejectedApps.length === 0) {
                rejectedBody.innerHTML = '';
                if (noRejected) noRejected.style.display = 'block';
            } else {
                if (noRejected) noRejected.style.display = 'none';
                rejectedBody.innerHTML = rejectedApps.map(app => `
                    <tr>
                        <td>${app.studentName || (app.student && app.student.name) || '-'}</td>
                        <td>${app.applicationType}</td>
                        <td>${app.route}</td>
                        <td>${dashboardCommon.formatDate(app.adminReview && app.adminReview.date ? app.adminReview.date : app.updatedAt)}</td>
                        <td>${app.adminReview && app.adminReview.rejectionReason ? app.adminReview.rejectionReason : '-'}</td>
                        <td><button class="action-btn view-btn" data-id="${app._id}"><i class="fas fa-eye"></i> View</button></td>
                    </tr>
                `).join('');
                // Add event listeners to view buttons
                const viewButtons = rejectedBody.querySelectorAll('.view-btn');
                viewButtons.forEach(button => {
                    button.addEventListener('click', async () => {
                        const appId = button.getAttribute('data-id');
                        const appDetails = await this.fetchApplicationById(appId);
                        if (appDetails) this.openReviewModal(appDetails);
                    });
                });
            }
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
            const res = await fetch(`${API_BASE_URL}/admin/history`, {
                headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
            });
            if (!res.ok) throw new Error('Failed to fetch admin history');
            const data = await res.json();
            const history = Array.isArray(data.history) ? data.history : (Array.isArray(data.activities) ? data.activities : []);
            if (history.length === 0) {
                if (noHistory) noHistory.style.display = 'block';
                return;
            }
            // Sort by date
            const sortedHistory = [...history].sort((a, b) => (b.date || b.createdAt) - (a.date || a.createdAt));
            if (historyBody) {
                historyBody.innerHTML = sortedHistory.map(entry => `
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
        const submitReviewBtn = document.getElementById('submit-review');
        const approvalActionSelect = document.getElementById('approval-action');
        const rejectionReasonGroup = document.getElementById('rejection-reason-group');
        const stampSignatureGroup = document.getElementById('stamp-signature-group');
        const addStampBtn = document.getElementById('add-stamp-btn');
        const addSignatureBtn = document.getElementById('add-signature-btn');
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
        
        // Approval action change handler
        if (approvalActionSelect) {
            approvalActionSelect.addEventListener('change', () => {
                const action = approvalActionSelect.value;
                
                // Toggle relevant form groups
                if (rejectionReasonGroup) {
                    rejectionReasonGroup.style.display = action === 'reject' ? 'block' : 'none';
                }
                
                if (stampSignatureGroup) {
                    stampSignatureGroup.style.display = action === 'approve' ? 'block' : 'none';
                }
                
                // Enable/disable submit button
                if (submitReviewBtn) {
                    submitReviewBtn.disabled = action === '';
                }
                
                // Show canvas for stamping/signing if approving
                if (this.canvas && action === 'approve') {
                    this.canvas.style.display = 'block';
                    this.initializeCanvas();
                } else if (this.canvas) {
                    this.canvas.style.display = 'none';
                }
            });
        }
        
        // Add stamp button
        if (addStampBtn) {
            addStampBtn.addEventListener('click', () => {
                this.addStamp();
            });
        }
        
        // Add signature button
        if (addSignatureBtn) {
            addSignatureBtn.addEventListener('click', () => {
                this.addSignature();
            });
        }
        
        // Submit review button
        if (submitReviewBtn) {
            submitReviewBtn.addEventListener('click', () => {
                this.submitReview();
            });
        }
    },
    
    // Open review modal
    openReviewModal: function(application, action = 'view') {
        // Accepts either application object or id
        let appObj = application;
        if (typeof appObj === 'string') {
            appObj = this.applications.find(app => app._id === appObj || app.id === appObj);
        }
        if (!appObj) {
            alert('Application not found');
            return;
        }
        this.selectedApplication = appObj;
        // Get modal elements
        const reviewModal = document.getElementById('review-modal');
        const modalTitle = document.querySelector('.modal-title');
        const approvalActionSelect = document.getElementById('approval-action');
        // Set modal title
        const submissionReadOnly = appObj.status !== 'submitted';
        if (modalTitle) {
            modalTitle.textContent = submissionReadOnly ? 'View Application' : 'Review Application';
        }
        // Robustly extract student info
        const student = appObj.student || {};
        document.getElementById('modal-student-name').textContent = student.name || appObj.studentName || '-';
        document.getElementById('modal-student-email').textContent = student.email || appObj.studentEmail || '-';
        // Application type
        let appType = '-';
        if (appObj.applicationType === 'new') appType = 'New Pass';
        else if (appObj.applicationType === 'renewal') appType = 'Renewal';
        document.getElementById('modal-application-type').textContent = appType;
        document.getElementById('modal-route').textContent = appObj.route || '-';
        document.getElementById('modal-college-id').textContent = appObj.collegeId || '-';
        document.getElementById('modal-duration').textContent = (appObj.duration !== undefined && appObj.duration !== null) ? appObj.duration : '-';
        // Dates
        function safeFormatDate(val) {
            if (!val) return '-';
            const d = new Date(val);
            return isNaN(d.getTime()) ? '-' : dashboardCommon.formatDate(val);
        }
        let submittedDate = appObj.createdAt || appObj.submittedAt;
        let approvedDate = appObj.adminReview && appObj.adminReview.date;
        let rejectedDate = appObj.adminReview && appObj.adminReview.date;
        let dateValue = submittedDate;
        if (appObj.status === 'admin_approved' && approvedDate) {
            dateValue = approvedDate;
        } else if (appObj.status === 'admin_rejected' && rejectedDate) {
            dateValue = rejectedDate;
        }
        document.getElementById('modal-submitted-date').textContent = safeFormatDate(dateValue);
        // Set ID proof image
        const idProofImg = document.getElementById('modal-id-proof');
        let idProofPath = appObj.idProof || (student && student.idProof);
        if (idProofImg && idProofPath) {
            // Remove any leading slash for robustness
            let src = idProofPath.replace(/^\/+/,'');
            // Always ensure path starts with uploads/
            if (!src.startsWith('uploads/')) {
                src = 'uploads/' + src;
            }
            // Always serve from backend root
            src = `${API_BASE_URL.replace(/\/api$/, '')}/${src}`;
            idProofImg.src = src;
            idProofImg.alt = 'ID Proof';
            idProofImg.style.display = 'block';
            // Handle broken image
            idProofImg.onerror = function() {
                this.src = '';
                this.alt = 'ID proof not found';
                this.style.display = 'block';
            };
        } else if (idProofImg) {
            idProofImg.src = '';
            idProofImg.alt = 'No ID proof provided';
            idProofImg.style.display = 'block';
        }
        // Show/hide approval options based on application status
        if (approvalActionSelect) {
            if (submissionReadOnly) {
                approvalActionSelect.parentElement.style.display = 'none';
                document.getElementById('submit-review').style.display = 'none';
            } else {
                approvalActionSelect.parentElement.style.display = 'block';
                document.getElementById('submit-review').style.display = 'block';
                approvalActionSelect.value = '';
                document.getElementById('rejection-reason-group').style.display = 'none';
                document.getElementById('stamp-signature-group').style.display = 'none';
                document.getElementById('submit-review').disabled = true;
                if (action === 'approve' || action === 'reject') {
                    approvalActionSelect.value = action;
                    const event = new Event('change');
                    approvalActionSelect.dispatchEvent(event);
                }
            }
        }
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
        this.ctx.fillText('Click "Add Official Stamp" or "Add Signature" buttons above', this.canvas.width / 2, 100);
    },
    
    // Add stamp to canvas
    addStamp: function() {
        if (!this.canvas || !this.ctx) return;
        
        // Draw stamp (circular seal)
        const centerX = this.canvas.width * 0.75;
        const centerY = this.canvas.height * 0.5;
        const radius = 50;
        
        // Draw outer circle
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.ctx.strokeStyle = '#9b59b6';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // Draw inner circle
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius - 10, 0, 2 * Math.PI);
        this.ctx.strokeStyle = '#9b59b6';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // Draw text
        this.ctx.font = 'bold 10px Arial';
        this.ctx.fillStyle = '#9b59b6';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('OFFICIAL STAMP', centerX, centerY - 15);
        this.ctx.fillText('SMART BUS PASS', centerX, centerY);
        this.ctx.fillText('ADMIN APPROVED', centerX, centerY + 15);
        
        // Draw date
        const date = new Date().toLocaleDateString();
        this.ctx.font = '10px Arial';
        this.ctx.fillText(date, centerX, centerY + 35);
    },
    
    // Add signature to canvas
    addSignature: function() {
        if (!this.canvas || !this.ctx) return;
        
        // Draw a signature-like shape
        const startX = this.canvas.width * 0.25;
        const startY = this.canvas.height * 0.7;
        
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        
        // Generate a squiggly line
        for (let i = 0; i < 100; i++) {
            const x = startX + i * 1.5;
            const y = startY + Math.sin(i / 5) * 10;
            this.ctx.lineTo(x, y);
        }
        
        this.ctx.strokeStyle = '#3498db';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Draw admin name below signature
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#3498db';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(auth.currentUser.name, startX + 75, startY + 30);
        this.ctx.font = '10px Arial';
        this.ctx.fillText('Admin Officer', startX + 75, startY + 45);
    },
    
    // Submit application review (with stamp/signature upload)
    submitReview: async function() {
        if (!this.selectedApplication) {
            alert('No application selected');
            return;
        }
        const action = document.getElementById('approval-action').value;
        const rejectionReason = document.getElementById('rejection-reason')?.value;
        if (action === '') {
            alert('Please select an action');
            return;
        }
        if (action === 'reject' && !rejectionReason) {
            alert('Please provide a reason for rejection');
            return;
        }
        // Get canvas image if approving
        let stampedDocument = null;
        if (action === 'approve' && this.canvas) {
            stampedDocument = this.canvas.toDataURL('image/png');
        }
        // Prepare FormData for approve endpoint (file upload)
        let url = '', method = 'POST', body = null;
        if (action === 'approve') {
            url = `${API_BASE_URL}/admin/approve/${this.selectedApplication._id}`;
            body = new FormData();
            if (stampedDocument) {
                // Convert dataURL to Blob
                const byteString = atob(stampedDocument.split(',')[1]);
                const mimeString = stampedDocument.split(',')[0].split(':')[1].split(';')[0];
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }
                const blob = new Blob([ab], { type: mimeString });
                body.append('stampedDocument', blob, 'stamped.png');
            }
        } else if (action === 'reject') {
            url = `${API_BASE_URL}/admin/reject/${this.selectedApplication._id}`;
            body = JSON.stringify({ rejectionReason });
        }
        try {
            const res = await fetch(url, {
                method,
                headers: action === 'approve' ? { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` } : {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                },
                body
            });
            if (!res.ok) throw new Error('Failed to process application');
            alert(action === 'approve' ? 'Application approved successfully!' : 'Application rejected successfully!');
            document.getElementById('review-modal').classList.remove('active');
            // Refresh lists and UI
            await this.loadApplications();
        } catch (err) {
            alert('Error: ' + err.message);
        }
    },
    
    // Approve or reject application
    handleApplicationAction: async function(appId, action, actionDetails = {}) {
        try {
            let url = '';
            let method = 'POST';
            let body = null;
            if (action === 'approve') {
                url = `${API_BASE_URL}/admin/approve/${appId}`;
                body = JSON.stringify(actionDetails);
            } else if (action === 'reject') {
                url = `${API_BASE_URL}/admin/reject/${appId}`;
                body = JSON.stringify(actionDetails);
            } else {
                throw new Error('Invalid action');
            }
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                },
                body
            });
            if (!res.ok) throw new Error('Failed to process application');
            // Refresh lists and UI
            await Promise.all([
                this.fetchPendingApplications(),
                this.fetchProcessedApplications(),
                this.loadHistory()
            ]);
            alert(action === 'approve' ? 'Application approved successfully!' : 'Application rejected successfully!');
        } catch (err) {
            alert('Error: ' + err.message);
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
    }
};

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', function() {
    adminDashboard.init();
});
