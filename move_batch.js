// assets/js/batch/move_batch.js
// Handle moving batch to different locations

import { showLoading, hideLoading, showNotification, closeModal } from './batch_utils.js';

export function moveBatch(batchId) {
    const modalHTML = `
        <div id="moveBatchModal" class="modal" style="display: flex;">
            <div class="modal-content" style="max-width: 450px;">
                <div class="modal-header">
                    <h3>📍 Move Batch Location</h3>
                    <button class="close" onclick="window.batchModule.closeModal('moveBatchModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="moveBatchForm" onsubmit="window.batchModule.saveBatchLocation(event, ${batchId})">
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
                    <button class="btn btn-secondary" onclick="window.batchModule.closeModal('moveBatchModal')">Cancel</button>
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

export async function saveBatchLocation(event, batchId) {
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