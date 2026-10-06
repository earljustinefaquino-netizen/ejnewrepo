// batches.js - Complete Batch Management with Error Handling

// Modal Management
function openAddBatchModal() {
    document.getElementById('addBatchModal').style.display = 'flex';
    // Set today as max date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').max = today;
    document.getElementById('startDate').value = today;
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        // Reset form if it exists
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// Add this temporary debugging version to batches.js
// Replace the addBatch function with this to see detailed error info

async function addBatch(event) {
    event.preventDefault();
    
    // Get all form values
    const batchName = document.getElementById('batchName')?.value?.trim();
    const breed = document.getElementById('breed')?.value;
    const initialCount = document.getElementById('initialCount')?.value;
    const startDate = document.getElementById('startDate')?.value;
    const location = document.getElementById('location')?.value;
    const notes = document.getElementById('notes')?.value?.trim();
    
    // Debug: Log all values
    console.log('Form Values:', {
        batchName,
        breed,
        initialCount,
        startDate,
        location,
        notes
    });
    
    // Check for missing batch name field
    if (!document.getElementById('batchName')) {
        console.error('CRITICAL: Batch Name field is missing from form!');
        showNotification('Form error: Batch Name field not found. Please refresh the page.', 'error');
        return;
    }
    
    const formData = {
        batchName: batchName,
        breed: breed,
        initialCount: parseInt(initialCount),
        startDate: startDate,
        location: location,
        notes: notes
    };
    
    // Validate
    if (!formData.batchName || !formData.breed || !formData.initialCount || !formData.startDate || !formData.location) {
        console.error('Validation Error:', {
            hasBatchName: !!formData.batchName,
            hasBreed: !!formData.breed,
            hasInitialCount: !!formData.initialCount,
            hasStartDate: !!formData.startDate,
            hasLocation: !!formData.location
        });
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    if (formData.initialCount < 1 || formData.initialCount > 10000) {
        showNotification('Initial count must be between 1 and 10,000', 'error');
        return;
    }
    
    showLoading();
    
    try {
        console.log('Sending request to: api/batch/add_batch.php');
        console.log('Request data:', JSON.stringify(formData, null, 2));
        
        const response = await fetch('api/batch/add_batch.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        // Try to get response text first
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        // Try to parse as JSON
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('Response was not valid JSON:', responseText);
            showNotification('Server error: Invalid response format. Check console for details.', 'error');
            hideLoading();
            return;
        }
        
        console.log('Parsed result:', result);
        
        if (result.success) {
            showNotification('Batch added successfully!', 'success');
            closeModal('addBatchModal');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            console.error('Server returned error:', result.message);
            showNotification(result.message || 'Error adding batch', 'error');
        }
    } catch (error) {
        console.error('Fetch Error Details:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        showNotification('Connection error: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}
// View Batch Details
async function viewBatch(batchId) {
    showLoading();
    
    try {
        const response = await fetch(`api/batch/get_batch.php?batch_id=${batchId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showBatchDetailsModal(result.data);
        } else {
            showNotification(result.message || 'Error loading batch details', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Connection error. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

function showBatchDetailsModal(batch) {
    // Calculate additional stats
    const startDate = new Date(batch.start_date);
    const today = new Date();
    const ageInDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    const ageInWeeks = Math.floor(ageInDays / 7);
    const survivalRate = batch.initial_count > 0 ? ((batch.current_count / batch.initial_count) * 100).toFixed(1) : 0;
    const mortalityRate = batch.initial_count > 0 ? ((batch.mortality_count / batch.initial_count) * 100).toFixed(1) : 0;
    
    const modalHTML = `
        <div id="viewBatchModal" class="modal" style="display: flex;">
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>🦆 Batch Details</h3>
                    <button class="close" onclick="closeModal('viewBatchModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="display: grid; gap: 1rem;">
                        <div class="detail-item">
                            <strong>Batch Code:</strong>
                            <span style="font-family: monospace; color: var(--primary-green); font-weight: 600;">${batch.batch_code}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Batch Name:</strong>
                            <span>${batch.batch_name}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Breed:</strong>
                            <span>${batch.breed}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Current Count:</strong>
                            <span style="font-size: 1.5rem; color: var(--primary-green); font-weight: 700;">
                                ${batch.current_count} ducks
                            </span>
                        </div>
                        <div class="detail-item">
                            <strong>Initial Count:</strong>
                            <span>${batch.initial_count} ducks</span>
                        </div>
                        <div class="detail-item">
                            <strong>Age:</strong>
                            <span>${ageInWeeks} weeks (${ageInDays} days)</span>
                        </div>
                        <div class="detail-item">
                            <strong>Status:</strong>
                            <span class="status-badge ${batch.status.toLowerCase().replace(' ', '-')}">${batch.status}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Health Status:</strong>
                            <span style="color: ${batch.health_status === 'Healthy' ? 'var(--success)' : batch.health_status === 'Monitoring' ? 'var(--warning)' : 'var(--danger)'}; font-weight: 600;">
                                ${batch.health_status}
                            </span>
                        </div>
                        <div class="detail-item">
                            <strong>Location:</strong>
                            <span>📍 ${batch.location}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Mortality:</strong>
                            <span style="color: ${mortalityRate > 5 ? 'var(--danger)' : 'var(--success)'}; font-weight: 600;">
                                ${batch.mortality_count} deaths (${mortalityRate}%)
                            </span>
                        </div>
                        <div class="detail-item">
                            <strong>Survival Rate:</strong>
                            <span style="color: var(--success); font-weight: 600; font-size: 1.2rem;">${survivalRate}%</span>
                        </div>
                        <div class="detail-item">
                            <strong>Start Date:</strong>
                            <span>${new Date(batch.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Created:</strong>
                            <span>${new Date(batch.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        ${batch.notes ? `
                        <div class="detail-item" style="grid-column: 1 / -1;">
                            <strong>Notes:</strong>
                            <p style="margin-top: 0.5rem; padding: 0.75rem; background: #f8f9fa; border-radius: 6px; white-space: pre-wrap;">
                                ${batch.notes}
                            </p>
                        </div>
                        ` : ''}
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="closeModal('viewBatchModal')">Close</button>
                    <button class="btn btn-primary" onclick="closeModal('viewBatchModal'); editBatch(${batch.batch_id})">Edit Batch</button>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('viewBatchModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Edit Batch
async function editBatch(batchId) {
    showLoading();
    
    try {
        const response = await fetch(`api/batch/get_batch.php?batch_id=${batchId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showEditBatchModal(result.data);
        } else {
            showNotification(result.message || 'Error loading batch', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Connection error. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

function showEditBatchModal(batch) {
    const modalHTML = `
        <div id="editBatchModal" class="modal" style="display: flex;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>✏️ Edit Batch: ${batch.batch_name}</h3>
                    <button class="close" onclick="closeModal('editBatchModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="editBatchForm" onsubmit="updateBatch(event, ${batch.batch_id})">
                        <div class="form-group">
                            <label>Batch Code:</label>
                            <input type="text" value="${batch.batch_code}" disabled style="background: #e9ecef; cursor: not-allowed;">
                            <small>Batch code cannot be changed</small>
                        </div>
                        <div class="form-group">
                            <label>Batch Name: <span style="color: red;">*</span></label>
                            <input type="text" id="editBatchName" value="${batch.batch_name}" required>
                        </div>
                        <div class="form-group">
                            <label>Current Count: <span style="color: red;">*</span></label>
                            <input type="number" id="editCurrentCount" value="${batch.current_count}" min="0" max="${batch.initial_count}" required>
                            <small>Initial: ${batch.initial_count} ducks | Current Mortality: ${batch.mortality_count}</small>
                        </div>
                        <div class="form-group">
                            <label>Status: <span style="color: red;">*</span></label>
                            <select id="editStatus" required>
                                <option value="Brooding" ${batch.status === 'Brooding' ? 'selected' : ''}>Brooding (0-8 weeks)</option>
                                <option value="Growing" ${batch.status === 'Growing' ? 'selected' : ''}>Growing (9-16 weeks)</option>
                                <option value="Laying" ${batch.status === 'Laying' ? 'selected' : ''}>Laying (17-20 weeks)</option>
                                <option value="Peak Production" ${batch.status === 'Peak Production' ? 'selected' : ''}>Peak Production (21-72 weeks)</option>
                                <option value="Declining" ${batch.status === 'Declining' ? 'selected' : ''}>Declining (72+ weeks)</option>
                                <option value="Retired" ${batch.status === 'Retired' ? 'selected' : ''}>Retired</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Location: <span style="color: red;">*</span></label>
                            <select id="editLocation" required>
                                <option value="Brooder House 1" ${batch.location === 'Brooder House 1' ? 'selected' : ''}>Brooder House 1</option>
                                <option value="Brooder House 2" ${batch.location === 'Brooder House 2' ? 'selected' : ''}>Brooder House 2</option>
                                <option value="Pen A1" ${batch.location === 'Pen A1' ? 'selected' : ''}>Pen A1</option>
                                <option value="Pen A2" ${batch.location === 'Pen A2' ? 'selected' : ''}>Pen A2</option>
                                <option value="Pen B1" ${batch.location === 'Pen B1' ? 'selected' : ''}>Pen B1</option>
                                <option value="Pen B2" ${batch.location === 'Pen B2' ? 'selected' : ''}>Pen B2</option>
                                <option value="Pen C1" ${batch.location === 'Pen C1' ? 'selected' : ''}>Pen C1</option>
                                <option value="Free Range Area 1" ${batch.location === 'Free Range Area 1' ? 'selected' : ''}>Free Range Area 1</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Notes:</label>
                            <textarea id="editNotes" rows="3" placeholder="Add any notes...">${batch.notes || ''}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="closeModal('editBatchModal')">Cancel</button>
                    <button type="submit" form="editBatchForm" class="btn btn-primary">Update Batch</button>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('editBatchModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

async function updateBatch(event, batchId) {
    event.preventDefault();
    
    const formData = {
        batch_id: batchId,
        batch_name: document.getElementById('editBatchName').value.trim(),
        current_count: parseInt(document.getElementById('editCurrentCount').value),
        status: document.getElementById('editStatus').value,
        location: document.getElementById('editLocation').value,
        notes: document.getElementById('editNotes').value.trim()
    };
    
    // Validate
    if (!formData.batch_name || formData.current_count < 0 || !formData.status || !formData.location) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch('api/batch/update_batch.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Batch updated successfully!', 'success');
            closeModal('editBatchModal');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showNotification(result.message || 'Error updating batch', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Connection error. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Move Batch Location
function moveBatch(batchId) {
    const modalHTML = `
        <div id="moveBatchModal" class="modal" style="display: flex;">
            <div class="modal-content" style="max-width: 450px;">
                <div class="modal-header">
                    <h3>📍 Move Batch Location</h3>
                    <button class="close" onclick="closeModal('moveBatchModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="moveBatchForm" onsubmit="saveBatchLocation(event, ${batchId})">
                        <div class="form-group">
                            <label>New Location: <span style="color: red;">*</span></label>
                            <select id="newLocation" required>
                                <option value="">Select Location</option>
                                <option value="Brooder House 1">Brooder House 1</option>
                                <option value="Brooder House 2">Brooder House 2</option>
                                <option value="Pen A1">Pen A1</option>
                                <option value="Pen A2">Pen A2</option>
                                <option value="Pen B1">Pen B1</option>
                                <option value="Pen B2">Pen B2</option>
                                <option value="Pen C1">Pen C1</option>
                                <option value="Free Range Area 1">Free Range Area 1</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Reason for Move:</label>
                            <textarea id="moveReason" rows="3" placeholder="Optional: Specify reason for relocation"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="closeModal('moveBatchModal')">Cancel</button>
                    <button type="submit" form="moveBatchForm" class="btn btn-primary">Move Batch</button>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('moveBatchModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

async function saveBatchLocation(event, batchId) {
    event.preventDefault();
    
    const newLocation = document.getElementById('newLocation').value;
    const reason = document.getElementById('moveReason').value.trim();
    
    if (!newLocation) {
        showNotification('Please select a location', 'error');
        return;
    }
    
    const formData = {
        batch_id: batchId,
        new_location: newLocation,
        reason: reason
    };
    
    showLoading();
    
    try {
        const response = await fetch('api/batch/move_batch.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Batch moved successfully!', 'success');
            closeModal('moveBatchModal');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showNotification(result.message || 'Error moving batch', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Connection error. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Record Mortality
function recordMortality(batchId) {
    const today = new Date().toISOString().split('T')[0];
    
    const modalHTML = `
        <div id="mortalityModal" class="modal" style="display: flex;">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>⚠️ Record Mortality</h3>
                    <button class="close" onclick="closeModal('mortalityModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 1rem; margin-bottom: 1rem; border-radius: 6px;">
                        <strong>⚠️ Important:</strong> This will reduce the current duck count permanently.
                    </div>
                    <form id="mortalityForm" onsubmit="saveMortality(event, ${batchId})">
                        <div class="form-group">
                            <label>Number of Deaths: <span style="color: red;">*</span></label>
                            <input type="number" id="mortalityCount" min="1" max="1000" required placeholder="Enter number of ducks">
                        </div>
                        <div class="form-group">
                            <label>Date Occurred: <span style="color: red;">*</span></label>
                            <input type="date" id="mortalityDate" max="${today}" required value="${today}">
                        </div>
                        <div class="form-group">
                            <label>Cause (if known):</label>
                            <select id="mortalityCause">
                                <option value="">Select Cause</option>
                                <option value="Disease">Disease</option>
                                <option value="Old Age">Old Age</option>
                                <option value="Predator">Predator Attack</option>
                                <option value="Accident">Accident</option>
                                <option value="Heat Stress">Heat Stress</option>
                                <option value="Cold Stress">Cold Stress</option>
                                <option value="Unknown">Unknown</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Additional Notes:</label>
                            <textarea id="mortalityNotes" rows="3" placeholder="Describe circumstances, symptoms, or preventive measures..."></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="closeModal('mortalityModal')">Cancel</button>
                    <button type="submit" form="mortalityForm" class="btn btn-primary" style="background: var(--danger);">Record Mortality</button>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('mortalityModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

async function saveMortality(event, batchId) {
    event.preventDefault();
    
    const mortalityCount = parseInt(document.getElementById('mortalityCount').value);
    const mortalityDate = document.getElementById('mortalityDate').value;
    const cause = document.getElementById('mortalityCause').value;
    const notes = document.getElementById('mortalityNotes').value.trim();
    
    if (!mortalityCount || !mortalityDate) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    if (mortalityCount <= 0) {
        showNotification('Mortality count must be greater than 0', 'error');
        return;
    }
    
    const formData = {
        batch_id: batchId,
        mortality_count: mortalityCount,
        mortality_date: mortalityDate,
        cause: cause,
        notes: notes
    };
    
    showLoading();
    
    try {
        const response = await fetch('api/batch/record_mortality.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`Mortality recorded: ${mortalityCount} deaths`, 'success');
            closeModal('mortalityModal');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showNotification(result.message || 'Error recording mortality', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Connection error. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Export Batches
async function exportBatches() {
    showLoading();
    try {
        window.open('api/batch/export_batch_pdf.php', '_blank');
        setTimeout(() => {
            hideLoading();
            showNotification('Export started. Check your downloads.', 'success');
        }, 1000);
    } catch (error) {
        console.error('Error:', error);
        hideLoading();
        showNotification('Export failed. Please try again.', 'error');
    }
}

// Utility Functions
function showLoading() {
    let loader = document.getElementById('loadingOverlay');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'loadingOverlay';
        loader.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); 
                        display: flex; justify-content: center; align-items: center; z-index: 9999;">
                <div style="background: white; padding: 2rem 3rem; border-radius: 15px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                    <div style="border: 4px solid #f3f3f3; border-top: 4px solid #4a7c59; border-radius: 50%; 
                                width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                    <p style="color: #4a7c59; font-weight: 600; margin: 0;">Loading...</p>
                </div>
            </div>
        `;
        document.body.appendChild(loader);
    }
    loader.style.display = 'block';
}

function hideLoading() {
    const loader = document.getElementById('loadingOverlay');
    if (loader) {
        loader.style.display = 'none';
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    
    notification.innerHTML = `
        <span><strong>${icons[type] || 'ℹ'}</strong> ${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Add required styles
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .notification {
        position: fixed;
        top: 20px;
        right: -400px;
        background: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 1rem;
        min-width: 300px;
        max-width: 500px;
        transition: right 0.3s ease;
    }
    
    .notification.show {
        right: 20px;
    }
    
    .notification-success { border-left: 4px solid #28a745; }
    .notification-error { border-left: 4px solid #dc3545; }
    .notification-warning { border-left: 4px solid #ffc107; }
    .notification-info { border-left: 4px solid #17a2b8; }
    
    .notification button {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #6c757d;
        margin-left: auto;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s;
    }
    
    .notification button:hover {
        background: #f8f9fa;
        color: #333;
    }
    
    .detail-item {
        display: grid;
        grid-template-columns: 180px 1fr;
        gap: 1rem;
        padding: 0.75rem;
        border-bottom: 1px solid #e9ecef;
    }
    
    .detail-item:last-child {
        border-bottom: none;
    }
    
    .detail-item strong {
        color: var(--primary-green);
        font-weight: 600;
    }
`;
document.head.appendChild(style);