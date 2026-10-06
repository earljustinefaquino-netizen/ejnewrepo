/**
 * User Management JavaScript - Fixed Version
 * File: assets/js/user_management.js
 */

// Get CSRF token from page
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || '';

// Modal Functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    const errorElement = document.getElementById(modalId.replace('Modal', 'Error'));
    if (errorElement) {
        errorElement.classList.remove('show');
    }
}

// Show Alert
function showAlert(elementId, message, type = 'error') {
    const alert = document.getElementById(elementId);
    if (!alert) return;
    
    alert.textContent = message;
    alert.className = `alert alert-${type} show`;
    
    setTimeout(() => {
        alert.classList.remove('show');
    }, 5000);
}

// Add User
function openAddUserModal() {
    openModal('addUserModal');
    document.getElementById('addUserForm').reset();
}

async function handleAddUser(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    formData.append('action', 'add_user');
    formData.append('csrf_token', csrfToken);
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
    
    try {
        const response = await fetch('user_management.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeModal('addUserModal');
            showSuccessMessage(data.message);
            setTimeout(() => location.reload(), 1500);
        } else {
            showAlert('addUserError', data.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('addUserError', 'An error occurred. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
    
    return false;
}

// View User
async function viewUser(userId) {
    const formData = new FormData();
    formData.append('action', 'get_user');
    formData.append('user_id', userId);
    formData.append('csrf_token', csrfToken);
    
    try {
        const response = await fetch('user_management.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            const user = data.user;
            const stats = data.stats;
            
            const statusClass = user.status === 'active' ? 'status-active' : 'status-inactive';
            const statusIcon = user.status === 'active' ? 'check-circle' : 'times-circle';
            
            // Determine profile picture path
            let profilePic = '../assets/images/default-avatar.png';
            if (user.profile_pic) {
                if (user.profile_pic.startsWith('uploads/')) {
                    profilePic = '../' + user.profile_pic;
                } else if (user.profile_pic.startsWith('../uploads/')) {
                    profilePic = user.profile_pic;
                } else {
                    profilePic = user.profile_pic;
                }
            }
            
            const content = `
                <div style="text-align: center; margin-bottom: 2rem;">
                    <img src="${profilePic}" 
                         alt="Profile Picture" 
                         onerror="this.src='../assets/images/default-avatar.png'"
                         style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 4px solid var(--primary);">
                </div>
                <div class="detail-row">
                    <div class="detail-label">User ID:</div>
                    <div class="detail-value">#${user.id}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Full Name:</div>
                    <div class="detail-value"><strong>${escapeHtml(user.fullname)}</strong></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Email:</div>
                    <div class="detail-value">${escapeHtml(user.useremail)}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Municipality:</div>
                    <div class="detail-value">${escapeHtml(user.municipality || 'N/A')}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">District:</div>
                    <div class="detail-value">${escapeHtml(user.district || 'N/A')}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Zip Code:</div>
                    <div class="detail-value">${escapeHtml(user.zipcode || 'N/A')}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Status:</div>
                    <div class="detail-value">
                        <span class="status-badge ${statusClass}">
                            <i class="fas fa-${statusIcon}"></i> 
                            ${user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                    </div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Joined:</div>
                    <div class="detail-value">${formatDate(user.created_at)}</div>
                </div>
                <hr style="margin: 1.5rem 0; border: none; border-top: 1px solid #e5e7eb;">
                <h3 style="margin-bottom: 1rem; color: #1f2937;">
                    <i class="fas fa-chart-bar"></i> Statistics
                </h3>
                <div class="detail-row">
                    <div class="detail-label">Total Batches:</div>
                    <div class="detail-value"><strong>${stats.total_batches}</strong></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Total Sales:</div>
                    <div class="detail-value"><strong>${stats.total_sales}</strong></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Total Revenue:</div>
                    <div class="detail-value"><strong style="color: #10b981;">₱${formatMoney(stats.total_revenue)}</strong></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Egg Collections:</div>
                    <div class="detail-value"><strong>${stats.total_collections}</strong></div>
                </div>
            `;
            
            document.getElementById('viewUserContent').innerHTML = content;
            openModal('viewUserModal');
        } else {
            alert(data.message || 'Failed to load user details');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while loading user details');
    }
}

// Edit User
async function editUser(userId) {
    const formData = new FormData();
    formData.append('action', 'get_user');
    formData.append('user_id', userId);
    formData.append('csrf_token', csrfToken);
    
    try {
        const response = await fetch('user_management.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            const user = data.user;
            document.getElementById('edit_user_id').value = user.id;
            document.getElementById('edit_fullname').value = user.fullname;
            document.getElementById('edit_email').value = user.useremail;
            document.getElementById('edit_municipality').value = user.municipality || '';
            document.getElementById('edit_district').value = user.district || '';
            document.getElementById('edit_zipcode').value = user.zipcode || '';
            document.getElementById('edit_status').value = user.status;
            
            // Display current profile picture (read-only)
            const profilePreview = document.getElementById('edit_profile_preview');
            if (user.profile_pic && user.profile_pic !== '') {
                profilePreview.src = '../' + user.profile_pic;
            } else {
                profilePreview.src = '../assets/images/default-avatar.png';
            }
            
            openModal('editUserModal');
        } else {
            alert(data.message || 'Failed to load user details');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while loading user details');
    }
}

async function handleEditUser(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    formData.append('action', 'update_user');
    formData.append('csrf_token', csrfToken);
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    
    try {
        const response = await fetch('user_management.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeModal('editUserModal');
            showSuccessMessage(data.message);
            setTimeout(() => location.reload(), 1500);
        } else {
            showAlert('editUserError', data.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('editUserError', 'An error occurred. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
    
    return false;
}

// Toggle Status
async function toggleStatus(userId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const actionText = newStatus === 'active' ? 'activate' : 'deactivate';
    
    if (!confirm(`Are you sure you want to ${actionText} this user?`)) {
        return;
    }
    
    const formData = new FormData();
    formData.append('action', 'toggle_status');
    formData.append('user_id', userId);
    formData.append('new_status', newStatus);
    formData.append('csrf_token', csrfToken);
    
    try {
        const response = await fetch('user_management.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccessMessage(data.message);
            setTimeout(() => location.reload(), 1000);
        } else {
            alert(data.message || 'Failed to update status');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
}

// Delete User
function deleteUser(userId, userName) {
    document.getElementById('deleteUserId').value = userId;
    document.getElementById('deleteUserName').textContent = userName;
    openModal('deleteUserModal');
}

async function confirmDelete() {
    const userId = document.getElementById('deleteUserId').value;
    const formData = new FormData();
    formData.append('action', 'delete_user');
    formData.append('user_id', userId);
    formData.append('csrf_token', csrfToken);
    
    const submitBtn = document.querySelector('#deleteUserModal .btn-danger-confirm');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
    
    try {
        const response = await fetch('user_management.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeModal('deleteUserModal');
            showSuccessMessage(data.message);
            setTimeout(() => location.reload(), 1500);
        } else {
            alert(data.message || 'Failed to delete user');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// Utility Functions
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatMoney(amount) {
    if (!amount) return '0.00';
    return parseFloat(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function showSuccessMessage(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-success show';
    alert.style.position = 'fixed';
    alert.style.top = '20px';
    alert.style.right = '20px';
    alert.style.zIndex = '10000';
    alert.style.minWidth = '300px';
    alert.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 3000);
}

// Close modal when clicking outside
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
});