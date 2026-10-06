// assets/js/batch/view_batch.js
// Handle viewing batch details

import { showLoading, hideLoading, showNotification, closeModal } from './batch_utils.js';
import { editBatch } from './edit_batch.js';

export async function viewBatch(batchId) {
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
                    <button class="close" onclick="window.batchModule.closeModal('viewBatchModal')">&times;</button>
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
                    <button class="btn btn-secondary" onclick="window.batchModule.closeModal('viewBatchModal')">Close</button>
                    <button class="btn btn-primary" onclick="window.batchModule.closeModal('viewBatchModal'); window.batchModule.editBatch(${batch.batch_id})">Edit Batch</button>
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