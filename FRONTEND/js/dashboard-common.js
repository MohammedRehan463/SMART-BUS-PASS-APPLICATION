/**
 * Smart Bus Pass - Common Dashboard Functionality
 * Shared functions and utilities for all dashboard types
 */

// Dashboard common functionality
const dashboardCommon = {
    // Initialize dashboard
    init: function() {
        // Check if user is authenticated, if not redirect to login
        if (!auth.checkAuth()) {
            window.location.href = 'login.html';
            return;
        }
        
        // Initialize sidebar navigation
        this.initSidebar();
        
        // Initialize common UI elements
        this.initUI();
        
        // Setup logout functionality
        this.setupLogout();
        
        // Initialize profile tab
        this.initProfileTab();
        
        // Initialize password change functionality
        this.initPasswordChange();
    },
    
    // Initialize sidebar navigation
    initSidebar: function() {
        const menuItems = document.querySelectorAll('.sidebar-menu a');
        const tabs = document.querySelectorAll('.tab-content');
        
        // Add click event listener to each menu item
        menuItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Get the tab to show
                const tabToShow = this.getAttribute('data-tab');
                
                // Remove active class from all menu items
                menuItems.forEach(menuItem => {
                    menuItem.classList.remove('active');
                });
                
                // Add active class to clicked menu item
                this.classList.add('active');
                
                // Hide all tabs
                tabs.forEach(tab => {
                    tab.classList.remove('active');
                });
                
                // Show the selected tab
                document.getElementById(`${tabToShow}-tab`).classList.add('active');
            });
        });
        
        // Mobile menu toggle
        const menuToggle = document.getElementById('menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        
        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', function() {
                sidebar.classList.toggle('active');
            });
            
            // Close sidebar when clicking outside on mobile
            document.addEventListener('click', function(e) {
                if (sidebar.classList.contains('active') && 
                    !sidebar.contains(e.target) && 
                    e.target !== menuToggle) {
                    sidebar.classList.remove('active');
                }
            });
        }
    },
    
    // Initialize common UI elements
    initUI: function() {
        // Set user name in sidebar
        const userNameElements = document.querySelectorAll('#user-name, #profile-name');
        const profileEmailElement = document.getElementById('profile-email');
        
        userNameElements.forEach(el => {
            if (el) el.textContent = auth.currentUser.name;
        });
        
        if (profileEmailElement) {
            profileEmailElement.textContent = auth.currentUser.email;
        }
        
        // Initialize inner tabs if they exist
        this.initInnerTabs();
    },
    
    // Initialize inner tabs
    initInnerTabs: function() {
        const tabButtons = document.querySelectorAll('.tab-button');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const tabName = this.getAttribute('data-tab');
                const tabContainer = this.closest('.tabs').nextElementSibling.parentElement;
                
                // Remove active class from all buttons in this tab set
                const siblingButtons = this.parentElement.querySelectorAll('.tab-button');
                siblingButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Hide all tab content in this container
                const tabContents = tabContainer.querySelectorAll('.tab-content');
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Show selected tab content
                document.getElementById(`${tabName}-tab`).classList.add('active');
            });
        });
    },
    
    // Setup logout functionality
    setupLogout: function() {
        const logoutBtn = document.getElementById('logout-btn');
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                auth.logout();
            });
        }
    },
    
    // Format date for display
    formatDate: function(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
    
    // Show empty state for a table
    showEmptyState: function(tableId, emptyStateId) {
        const table = document.getElementById(tableId);
        const emptyState = document.getElementById(emptyStateId);
        
        if (table) table.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
    },
    
    // Hide empty state for a table
    hideEmptyState: function(tableId, emptyStateId) {
        const table = document.getElementById(tableId);
        const emptyState = document.getElementById(emptyStateId);
        
        if (table) table.style.display = 'table';
        if (emptyState) emptyState.style.display = 'none';
    },
    
    // Initialize profile tab functionality
    initProfileTab: function() {
        const changePasswordBtn = document.getElementById('change-password-btn');
        const passwordModal = document.getElementById('password-modal');
        const closePasswordModalBtn = document.getElementById('close-password-modal');
        
        if (changePasswordBtn && passwordModal) {
            // Open change password modal
            changePasswordBtn.addEventListener('click', function() {
                passwordModal.classList.add('active');
            });
            
            // Close change password modal
            if (closePasswordModalBtn) {
                closePasswordModalBtn.addEventListener('click', function() {
                    passwordModal.classList.remove('active');
                });
            }
            
            // Close modal when clicking outside
            passwordModal.addEventListener('click', function(e) {
                if (e.target === this) {
                    this.classList.remove('active');
                }
            });
            
            // Cancel button
            const cancelPasswordBtn = document.getElementById('cancel-password-change');
            if (cancelPasswordBtn) {
                cancelPasswordBtn.addEventListener('click', function() {
                    passwordModal.classList.remove('active');
                });
            }
        }
    },
    
    // Initialize password change functionality
    initPasswordChange: function() {
        const changePasswordForm = document.getElementById('change-password-form');
        const currentPasswordInput = document.getElementById('current-password');
        const newPasswordInput = document.getElementById('new-password-change');
        const confirmNewPasswordInput = document.getElementById('confirm-new-password');
        const savePasswordBtn = document.getElementById('save-new-password');
        const passwordModal = document.getElementById('password-modal');
        
        if (savePasswordBtn) {
            savePasswordBtn.addEventListener('click', function() {
                // Validate form
                const currentPassword = currentPasswordInput.value;
                const newPassword = newPasswordInput.value;
                const confirmNewPassword = confirmNewPasswordInput.value;
                
                // Clear previous error messages
                const errorElement = document.createElement('p');
                errorElement.className = 'error-message';
                
                // Remove any existing error message
                const existingError = changePasswordForm.querySelector('.error-message');
                if (existingError) {
                    existingError.remove();
                }
                
                // Validate inputs
                if (!currentPassword || !newPassword || !confirmNewPassword) {
                    errorElement.textContent = 'Please fill in all fields';
                    changePasswordForm.prepend(errorElement);
                    return;
                }
                
                // Check if new passwords match
                if (newPassword !== confirmNewPassword) {
                    errorElement.textContent = 'New passwords do not match';
                    changePasswordForm.prepend(errorElement);
                    return;
                }
                
                // Validate password length
                if (newPassword.length < 4) {
                    errorElement.textContent = 'Password must be at least 4 characters long';
                    changePasswordForm.prepend(errorElement);
                    return;
                }
                
                // Show loading state
                savePasswordBtn.disabled = true;
                savePasswordBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
                
                // Try to change password
                auth.changePassword(auth.currentUser.email, currentPassword, newPassword)
                    .then(() => {
                        // Show success message
                        const successElement = document.createElement('p');
                        successElement.className = 'success-message';
                        successElement.textContent = 'Password changed successfully!';
                        
                        // Clear form and show success
                        changePasswordForm.reset();
                        changePasswordForm.prepend(successElement);
                        
                        // Reset button
                        savePasswordBtn.disabled = false;
                        savePasswordBtn.textContent = 'Save Changes';
                        
                        // Close modal after a delay
                        setTimeout(() => {
                            passwordModal.classList.remove('active');
                            
                            // Remove success message when modal is closed
                            if (successElement) {
                                successElement.remove();
                            }
                        }, 2000);
                    })
                    .catch(error => {
                        // Show error message
                        errorElement.textContent = error;
                        changePasswordForm.prepend(errorElement);
                        
                        // Reset button
                        savePasswordBtn.disabled = false;
                        savePasswordBtn.textContent = 'Save Changes';
                    });
            });
        }
    },
    
    // Get all applications from backend
    getApplications: async function() {
        const res = await fetch(`${API_BASE_URL}/applications`, {
            headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
        });
        if (!res.ok) throw new Error('Failed to fetch applications');
        const data = await res.json();
        // If backend returns { success, applications: [...] }, return the array
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.applications)) return data.applications;
        // fallback: if not array, return empty array
        return [];
    },

    // Save (create) application to backend
    saveApplication: async function(applicationData, idProofFile) {
        const formData = new FormData();
        for (const key in applicationData) {
            formData.append(key, applicationData[key]);
        }
        if (idProofFile) formData.append('idProof', idProofFile);
        const res = await fetch(`${API_BASE_URL}/applications`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
            body: formData
        });
        if (!res.ok) throw new Error('Failed to submit application');
        return res.json();
    },

    // Find application by ID (fetch from backend)
    findApplicationById: async function(id) {
        const res = await fetch(`${API_BASE_URL}/applications/${id}`, {
            headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
        });
        if (!res.ok) throw new Error('Failed to fetch application');
        return res.json();
    },

    // Update application status (PUT)
    updateApplicationStatus: async function(id, newStatus, actionDetails = {}) {
        const res = await fetch(`${API_BASE_URL}/applications/status/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            },
            body: JSON.stringify({ status: newStatus, ...actionDetails })
        });
        if (!res.ok) throw new Error('Failed to update application status');
        return res.json();
    },
    
    // Generate a random ID
    generateId: function() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }
};

// Initialize common dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    dashboardCommon.init();
});
