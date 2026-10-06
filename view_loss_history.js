// assets/js/batch/view_loss_history.js
// Fixed: View detailed loss history WITHOUT Sold data

import { showLoading, hideLoading, showNotification, closeModal } from './batch_utils.js';

export async function viewLossHistory(batchId) {
    showLoading();
    
    try {
        const response = await fetch(`api/batch/get_loss_history.php?batch_id=${batchId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showLossHistoryModal(result.data);
        } else {
            showNotification(result.message || 'Error loading loss history', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Connection error. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

function showLossHistoryModal(data) {
    const batch = data.batch;
    const losses = data.losses;
    const summary = data.summary;
    
    // Build loss history table
    let lossTableRows = '';
    if (losses.length > 0) {
        losses.forEach(loss => {
            const typeIcons = {
                'Mortality': '⚠️',
                'Missing': '🔍',
                'Culled': '✂️',
                'Other': '📋'
            };
            
            const typeColors = {
                'Mortality': '#dc3545',
                'Missing': '#ff9800',
                'Culled': '#ff5722',
                'Other': '#17a2b8'
            };
            
            const icon = typeIcons[loss.loss_type] || '📊';
            const color = typeColors[loss.loss_type] || '#6c757d';
            
            lossTableRows += `
                <tr>
                    <td>${new Date(loss.loss_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    <td>
                        <span style="color: ${color}; font-weight: 600;">
                            ${icon} ${loss.loss_type}
                        </span>
                    </td>
                    <td style="text-align: center; font-weight: 700; color: ${color};">${loss.loss_count}</td>
                    <td>${loss.cause || '-'}</td>
                    <td>
                        ${loss.circumstances ? `<small>${loss.circumstances.substring(0, 50)}${loss.circumstances.length > 50 ? '...' : ''}</small>` : '-'}
                    </td>
                </tr>
            `;
        });
    } else {
        lossTableRows = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem; color: #999;">
                    No loss records found for this batch
                </td>
            </tr>
        `;
    }
    
    const modalHTML = `
        <div id="lossHistoryModal" class="modal" style="display: flex;">
            <div class="modal-content" style="max-width: 900px;">
                <div class="modal-header">
                    <h3>📊 Loss History: ${batch.batch_name}</h3>
                    <button class="close" onclick="window.batchModule.closeModal('lossHistoryModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <!-- Batch Info -->
                    <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;">
                            <div>
                                <small style="color: #666;">Batch Code</small>
                                <div style="font-weight: 700; color: var(--primary-green);">${batch.batch_code}</div>
                            </div>
                            <div>
                                <small style="color: #666;">Initial Count</small>
                                <div style="font-weight: 700;">${batch.initial_count} ducks</div>
                            </div>
                            <div>
                                <small style="color: #666;">Current Count</small>
                                <div style="font-weight: 700; color: var(--success);">${batch.current_count} ducks</div>
                            </div>
                            <div>
                                <small style="color: #666;">Survival Rate</small>
                                <div style="font-weight: 700; color: var(--primary-green);">${summary.survival_rate}%</div>
                            </div>
                        </div>
                    </div>

                    <!-- Loss Summary Cards (WITHOUT Sold) -->
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
                        <div style="background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%); padding: 1rem; border-radius: 8px; text-align: center;">
                            <div style="font-size: 1.5rem;">⚠️</div>
                            <div style="font-size: 1.5rem; font-weight: 800; color: #c62828;">${summary.mortality_count}</div>
                            <small style="color: #666;">Mortality</small>
                            <div style="font-size: 0.75rem; color: #c62828; margin-top: 0.25rem;">${summary.mortality_rate}%</div>
                        </div>
                        <div style="background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); padding: 1rem; border-radius: 8px; text-align: center;">
                            <div style="font-size: 1.5rem;">🔍</div>
                            <div style="font-size: 1.5rem; font-weight: 800; color: #e65100;">${summary.missing_count}</div>
                            <small style="color: #666;">Missing</small>
                            <div style="font-size: 0.75rem; color: #e65100; margin-top: 0.25rem;">${summary.missing_rate}%</div>
                        </div>
                        <div style="background: linear-gradient(135deg, #fbe9e7 0%, #ffccbc 100%); padding: 1rem; border-radius: 8px; text-align: center;">
                            <div style="font-size: 1.5rem;">✂️</div>
                            <div style="font-size: 1.5rem; font-weight: 800; color: #d84315;">${summary.culled_count}</div>
                            <small style="color: #666;">Culled</small>
                        </div>
                        <div style="background: linear-gradient(135deg, #e1f5fe 0%, #b3e5fc 100%); padding: 1rem; border-radius: 8px; text-align: center;">
                            <div style="font-size: 1.5rem;">📋</div>
                            <div style="font-size: 1.5rem; font-weight: 800; color: #01579b;">${summary.other_count}</div>
                            <small style="color: #666;">Other</small>
                        </div>
                    </div>

                    <!-- Loss History Table -->
                    <div style="margin-top: 1.5rem;">
                        <h4 style="margin-bottom: 1rem; color: #333;">Detailed Loss Records</h4>
                        <div style="max-height: 400px; overflow-y: auto; border: 1px solid #e0e0e0; border-radius: 8px;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead style="background: #f5f5f5; position: sticky; top: 0; z-index: 1;">
                                    <tr>
                                        <th style="padding: 0.75rem; text-align: left; font-size: 0.85rem; border-bottom: 2px solid #ddd;">Date</th>
                                        <th style="padding: 0.75rem; text-align: left; font-size: 0.85rem; border-bottom: 2px solid #ddd;">Type</th>
                                        <th style="padding: 0.75rem; text-align: center; font-size: 0.85rem; border-bottom: 2px solid #ddd;">Count</th>
                                        <th style="padding: 0.75rem; text-align: left; font-size: 0.85rem; border-bottom: 2px solid #ddd;">Cause/Reason</th>
                                        <th style="padding: 0.75rem; text-align: left; font-size: 0.85rem; border-bottom: 2px solid #ddd;">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${lossTableRows}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Total Loss Summary -->
                    <div style="margin-top: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 8px; border-left: 4px solid var(--primary-green);">
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                            <div>
                                <small style="color: #666;">Total Losses (Death + Missing)</small>
                                <div style="font-size: 1.2rem; font-weight: 700; color: #c62828;">${summary.total_losses} ducks</div>
                            </div>
                            <div>
                                <small style="color: #666;">Total Loss Rate</small>
                                <div style="font-size: 1.2rem; font-weight: 700; color: #d84315;">${summary.total_loss_rate}%</div>
                            </div>
                            <div>
                                <small style="color: #666;">Total Incidents</small>
                                <div style="font-size: 1.2rem; font-weight: 700; color: #666;">${losses.length} records</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="window.batchModule.closeModal('lossHistoryModal')">Close</button>
                    <button class="btn btn-primary" onclick="window.batchModule.exportLossHistory(${batch.batch_id})">📥 Export Report</button>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('lossHistoryModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

export async function exportLossHistory(batchId) {
    showLoading();
    try {
        window.open(`api/batch/export_loss_history.php?batch_id=${batchId}`, '_blank');
        setTimeout(() => {
            hideLoading();
            showNotification('Loss history export started. Check your downloads.', 'success');
        }, 1000);
    } catch (error) {
        console.error('Error:', error);
        hideLoading();
        showNotification('Export failed. Please try again.', 'error');
    }
}