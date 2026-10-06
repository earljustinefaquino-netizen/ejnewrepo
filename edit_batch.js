// assets/js/batch/edit_batch.js
// Handle editing batch information

import { showLoading, hideLoading, showNotification, closeModal } from './batch_utils.js';

export async function editBatch(batchId) {
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
                    <button class="close" onclick="window.batchModule.closeModal('editBatchModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="editBatchForm" onsubmit="window.batchModule.updateBatch(event, ${batch.batch_id})">
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
                    <button class="btn btn-secondary" onclick="window.batchModule.closeModal('editBatchModal')">Cancel</button>
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

export async function updateBatch(event, batchId) {
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