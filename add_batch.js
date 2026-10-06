// assets/js/batch/add_batch.js
// Handle adding new batches

import { showLoading, hideLoading, showNotification, closeModal } from './batch_utils.js';

export function openAddBatchModal() {
    document.getElementById('addBatchModal').style.display = 'flex';
    // Set today as max date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').max = today;
    document.getElementById('startDate').value = today;
}

export async function addBatch(event) {
    event.preventDefault();
    
    // Get all form values
    const batchName = document.getElementById('batchName')?.value?.trim();
    const breed = document.getElementById('breed')?.value;
    const initialCount = document.getElementById('initialCount')?.value;
    const startDate = document.getElementById('startDate')?.value;
    const location = document.getElementById('location')?.value;
    const notes = document.getElementById('notes')?.value?.trim();
    
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
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    if (formData.initialCount < 1 || formData.initialCount > 10000) {
        showNotification('Initial count must be between 1 and 10,000', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch('api/batch/add_batch.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const responseText = await response.text();
        
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('Response was not valid JSON:', responseText);
            showNotification('Server error: Invalid response format.', 'error');
            hideLoading();
            return;
        }
        
        if (result.success) {
            showNotification('Batch added successfully!', 'success');
            closeModal('addBatchModal');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showNotification(result.message || 'Error adding batch', 'error');
        }
    } catch (error) {
        console.error('Fetch Error:', error);
        showNotification('Connection error: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}