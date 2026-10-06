// assets/js/batch/record_mortality.js
// FIXED VERSION - Proper data handling and validation

import { showLoading, hideLoading, showNotification, closeModal } from './batch_utils.js';

export function recordMortality(batchId) {
    const today = new Date().toISOString().split('T')[0];
    
    const modalHTML = `
        <div id="mortalityModal" class="modal" style="display: flex;">
            <div class="modal-content" style="max-width: 550px;">
                <div class="modal-header">
                    <h3>📊 Record Duck Loss</h3>
                    <button class="close" onclick="window.batchModule.closeModal('mortalityModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 1rem; margin-bottom: 1rem; border-radius: 6px;">
                        <strong>⚠️ Note:</strong> This will permanently reduce the current duck count.
                    </div>
                    <form id="mortalityForm">
                        <div class="form-group">
                            <label>Loss Type: <span style="color: red;">*</span></label>
                            <select id="lossType" required>
                                <option value="">Select Type</option>
                                <option value="Mortality">🦆 Mortality (Death)</option>
                                <option value="Missing">🔍 Missing/Lost</option>
                                <option value="Culled">✂️ Culled (Removed)</option>
                                <option value="Other">📋 Other</option>
                            </select>
                            <small id="lossTypeHint" style="color: #666; display: block; margin-top: 0.25rem;"></small>
                        </div>
                        
                        <div class="form-group">
                            <label>Number of Ducks: <span style="color: red;">*</span></label>
                            <input type="number" id="lossCount" min="1" required placeholder="Enter number of ducks">
                        </div>
                        
                        <div class="form-group">
                            <label>Date Occurred: <span style="color: red;">*</span></label>
                            <input type="date" id="lossDate" max="${today}" required value="${today}">
                        </div>
                        
                        <div class="form-group" id="causeGroup">
                            <label id="causeLabel">Cause/Reason:</label>
                            <select id="lossCause">
                                <option value="">Select Cause</option>
                            </select>
                        </div>
                        
                        <div class="form-group" id="circumstancesGroup" style="display: none;">
                            <label>Circumstances:</label>
                            <textarea id="circumstances" rows="2" placeholder="Describe what happened (optional)"></textarea>
                        </div>
                        
                        <div class="form-group" id="actionGroup" style="display: none;">
                            <label>Action Taken:</label>
                            <textarea id="actionTaken" rows="2" placeholder="What measures were taken (optional)"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label>Additional Notes:</label>
                            <textarea id="lossNotes" rows="2" placeholder="Any other relevant information (optional)"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="window.batchModule.closeModal('mortalityModal')">Cancel</button>
                    <button type="button" class="btn btn-primary" id="submitBtn" onclick="window.batchModule.saveMortality(event, ${batchId})">Record Loss</button>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('mortalityModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Setup loss type change handler
    document.getElementById('lossType').addEventListener('change', updateLossTypeUI);
}

function updateLossTypeUI() {
    const lossType = document.getElementById('lossType').value;
    const causeSelect = document.getElementById('lossCause');
    const causeLabel = document.getElementById('causeLabel');
    const lossTypeHint = document.getElementById('lossTypeHint');
    const circumstancesGroup = document.getElementById('circumstancesGroup');
    const actionGroup = document.getElementById('actionGroup');
    const submitBtn = document.getElementById('submitBtn');
    
    // Clear previous options
    causeSelect.innerHTML = '<option value="">Select Cause</option>';
    
    // Update UI based on loss type
    switch(lossType) {
        case 'Mortality':
            lossTypeHint.textContent = 'Record deaths from natural causes, disease, or accidents';
            causeLabel.textContent = 'Cause of Death:';
            causeSelect.innerHTML += `
                <option value="Disease">Disease/Illness</option>
                <option value="Respiratory Infection">Respiratory Infection</option>
                <option value="Duck Plague">Duck Plague</option>
                <option value="Old Age">Old Age/Natural</option>
                <option value="Predator Attack">Predator Attack</option>
                <option value="Accident">Accident/Injury</option>
                <option value="Heat Stress">Heat Stress</option>
                <option value="Cold Stress">Cold Stress</option>
                <option value="Unknown">Unknown Cause</option>
                <option value="Other">Other</option>
            `;
            circumstancesGroup.style.display = 'block';
            actionGroup.style.display = 'block';
            submitBtn.style.background = '#dc3545';
            submitBtn.innerHTML = '⚠️ Record Mortality';
            break;
            
        case 'Missing':
            lossTypeHint.textContent = 'Report ducks that are missing or lost';
            causeLabel.textContent = 'Suspected Reason:';
            causeSelect.innerHTML += `
                <option value="Escaped">Escaped/Flew Away</option>
                <option value="Stolen">Stolen/Theft</option>
                <option value="Predator">Taken by Predator</option>
                <option value="Strayed">Strayed from Flock</option>
                <option value="Unknown">Unknown</option>
                <option value="Other">Other</option>
            `;
            circumstancesGroup.style.display = 'block';
            actionGroup.style.display = 'block';
            submitBtn.style.background = '#ff9800';
            submitBtn.innerHTML = '🔍 Record Missing';
            break;
            
        case 'Culled':
            lossTypeHint.textContent = 'Record ducks removed due to health or quality issues';
            causeLabel.textContent = 'Reason for Culling:';
            causeSelect.innerHTML += `
                <option value="Poor Production">Poor/No Egg Production</option>
                <option value="Chronic Illness">Chronic Illness</option>
                <option value="Deformity">Physical Deformity</option>
                <option value="Aggressive Behavior">Aggressive Behavior</option>
                <option value="Old Age">Too Old/Past Prime</option>
                <option value="Other">Other</option>
            `;
            circumstancesGroup.style.display = 'block';
            actionGroup.style.display = 'none';
            submitBtn.style.background = '#ff9800';
            submitBtn.innerHTML = '✂️ Record Culling';
            break;
            
        case 'Other':
            lossTypeHint.textContent = 'Record other types of duck reduction';
            causeLabel.textContent = 'Reason:';
            causeSelect.innerHTML += `
                <option value="Transferred">Transferred to Another Farm</option>
                <option value="Donated">Donated/Given Away</option>
                <option value="Other">Other</option>
            `;
            circumstancesGroup.style.display = 'block';
            actionGroup.style.display = 'none';
            submitBtn.style.background = '#17a2b8';
            submitBtn.innerHTML = '📋 Record Loss';
            break;
            
        default:
            lossTypeHint.textContent = '';
            circumstancesGroup.style.display = 'none';
            actionGroup.style.display = 'none';
            submitBtn.style.background = '';
            submitBtn.innerHTML = 'Record Loss';
    }
}

export async function saveMortality(event, batchId) {
    event.preventDefault();
    
    console.log('saveMortality called with batchId:', batchId);
    
    // Get form elements
    const lossTypeEl = document.getElementById('lossType');
    const lossCountEl = document.getElementById('lossCount');
    const lossDateEl = document.getElementById('lossDate');
    const causeEl = document.getElementById('lossCause');
    const circumstancesEl = document.getElementById('circumstances');
    const actionTakenEl = document.getElementById('actionTaken');
    const notesEl = document.getElementById('lossNotes');
    
    // Get and clean values - NO "n/a" strings
    const lossType = lossTypeEl?.value?.trim() || '';
    const lossCount = parseInt(lossCountEl?.value) || 0;
    const lossDate = lossDateEl?.value?.trim() || '';
    const cause = causeEl?.value?.trim() || '';
    const circumstances = circumstancesEl?.value?.trim() || '';
    const actionTaken = actionTakenEl?.value?.trim() || '';
    const notes = notesEl?.value?.trim() || '';
    
    console.log('Form values:', {
        lossType,
        lossCount,
        lossDate,
        cause,
        circumstances,
        actionTaken,
        notes
    });
    
    // Validation
    if (!lossType) {
        showNotification('Please select a loss type', 'error');
        lossTypeEl?.focus();
        return;
    }
    
    if (!lossCount || lossCount <= 0) {
        showNotification('Please enter a valid duck count', 'error');
        lossCountEl?.focus();
        return;
    }
    
    if (!lossDate) {
        showNotification('Please select a date', 'error');
        lossDateEl?.focus();
        return;
    }
    
    // Prepare clean data object
    const formData = {
        batch_id: parseInt(batchId),
        loss_type: lossType,
        loss_count: lossCount,
        loss_date: lossDate,
        cause: cause,
        circumstances: circumstances,
        action_taken: actionTaken,
        notes: notes
    };
    
    console.log('Sending clean data:', formData);
    
    showLoading();
    
    try {
        const response = await fetch('api/batch/record_mortality.php', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        console.log('Response status:', response.status);
        console.log('Response content-type:', response.headers.get('content-type'));
        
        // Get response text first for debugging
        const responseText = await response.text();
        console.log('Raw response:', responseText.substring(0, 500));
        
        // Check if response is actually JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.error('Server did not return JSON. Content-Type:', contentType);
            console.error('Response preview:', responseText.substring(0, 200));
            throw new Error('Server returned non-JSON response. Check PHP error logs.');
        }
        
        // Parse JSON
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            console.error('Full response:', responseText);
            throw new Error('Invalid JSON from server. Check PHP for errors or warnings.');
        }
        
        console.log('Parsed result:', result);
        
        if (result.success) {
            const typeEmojis = {
                'Mortality': '⚠️',
                'Missing': '🔍',
                'Culled': '✂️',
                'Other': '📋'
            };
            
            const emoji = typeEmojis[lossType] || '📊';
            showNotification(`${emoji} ${result.message}`, 'success');
            closeModal('mortalityModal');
            
            // Reload after short delay
            setTimeout(() => window.location.reload(), 1500);
        } else {
            showNotification(result.message || 'Error recording loss', 'error');
            if (result.debug) {
                console.error('Server debug info:', result.debug);
            }
        }
    } catch (error) {
        console.error('Fetch error:', error);
        showNotification('Connection error: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Make updateLossTypeUI available globally for event handlers
window.updateLossTypeUI = updateLossTypeUI;