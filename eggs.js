// eggs.js - Complete Egg Collection Management

// State
window.currentBatchDucks = 0;
window.editingCollectionId = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeSearch();
});

// Search functionality
function initializeSearch() {
    const searchInput = document.getElementById('searchEggs');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            filterCollectionRows(searchTerm);
        });
    }
}

function filterCollectionRows(searchTerm) {
    const rows = document.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Form functions
function updateBatchInfo() {
    const select = document.getElementById('batchId');
    const option = select.options[select.selectedIndex];
    const duckCount = option.dataset.count || 0;
    window.currentBatchDucks = parseInt(duckCount);
    calculateQuality();
}

function calculateQuality() {
    const total = parseInt(document.getElementById('totalEggs').value) || 0;
    const good = parseInt(document.getElementById('goodEggs').value) || 0;
    const cracked = parseInt(document.getElementById('crackedEggs').value) || 0;
    const dirty = parseInt(document.getElementById('dirtyEggs').value) || 0;
    const small = parseInt(document.getElementById('smallEggs').value) || 0;
    const duckCount = window.currentBatchDucks || 1;
    
    // Validate that good eggs don't exceed total
    if (good > total) {
        document.getElementById('goodEggs').value = total;
        return;
    }
    
    // Auto-calculate other categories
    const sumOthers = cracked + dirty + small;
    if (good + sumOthers > total) {
        showNotification('Total of categories cannot exceed total eggs', 'warning');
    }
    
    // Quality rate
    const qualityRate = total > 0 ? Math.round((good / total) * 100) : 0;
    document.getElementById('qualityRate').textContent = qualityRate + '%';
    
    // Production rate
    const productionRate = duckCount > 0 ? Math.round((total / duckCount) * 100) : 0;
    document.getElementById('productionRate').textContent = productionRate + '%';
    
    // Average per duck
    const avgPerDuck = duckCount > 0 ? (total / duckCount).toFixed(2) : '0.00';
    document.getElementById('avgPerDuck').textContent = avgPerDuck;
}

function resetForm() {
    document.getElementById('eggCollectionForm').reset();
    document.getElementById('qualityRate').textContent = '0%';
    document.getElementById('productionRate').textContent = '0%';
    document.getElementById('avgPerDuck').textContent = '0';
    window.currentBatchDucks = 0;
}

// Record eggs
async function recordEggs(event) {
    event.preventDefault();
    
    const formData = {
        collectionDate: document.getElementById('collectionDate').value,
        batchId: document.getElementById('batchId').value,
        collectionTime: document.getElementById('collectionTime').value,
        totalEggs: document.getElementById('totalEggs').value,
        goodEggs: document.getElementById('goodEggs').value,
        crackedEggs: document.getElementById('crackedEggs').value,
        dirtyEggs: document.getElementById('dirtyEggs').value,
        smallEggs: document.getElementById('smallEggs').value,
        weatherCondition: document.getElementById('weatherCondition').value,
        notes: document.getElementById('notes').value
    };
    
    // Validation
    const total = parseInt(formData.totalEggs);
    const sum = parseInt(formData.goodEggs) + parseInt(formData.crackedEggs) + 
                parseInt(formData.dirtyEggs) + parseInt(formData.smallEggs);
    
    if (sum > total) {
        showNotification('Sum of egg categories cannot exceed total eggs', 'error');
        return;
    }
    
    try {
        const response = await fetch('api/egg/add_egg_collection.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Egg collection recorded successfully!', 'success');
            setTimeout(() => location.reload(), 1500);
        } else {
            showNotification(result.message || 'Error recording collection', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

// Edit collection
async function editCollection(collectionId) {
    try {
        const response = await fetch(`api/egg/get_egg_collection.php?id=${collectionId}`);
        const result = await response.json();
        
        if (result.success) {
            populateEditForm(result.data);
            openEditModal();
        } else {
            showNotification('Error loading collection data', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Network error', 'error');
    }
}

function populateEditForm(data) {
    window.editingCollectionId = data.collection_id;
    
    document.getElementById('editCollectionDate').value = data.collection_date;
    document.getElementById('editBatchId').value = data.batch_id;
    document.getElementById('editCollectionTime').value = data.collection_time || 'Morning';
    document.getElementById('editTotalEggs').value = data.total_eggs;
    document.getElementById('editGoodEggs').value = data.good_eggs;
    document.getElementById('editCrackedEggs').value = data.cracked_eggs;
    document.getElementById('editDirtyEggs').value = data.dirty_eggs;
    document.getElementById('editSmallEggs').value = data.small_eggs;
    document.getElementById('editWeatherCondition').value = data.weather_condition || 'Sunny';
    document.getElementById('editNotes').value = data.notes || '';
    
    // Update batch info for calculations
    const select = document.getElementById('editBatchId');
    const option = select.options[select.selectedIndex];
    const duckCount = option.dataset.count || data.current_count || 1;
    window.currentBatchDucks = parseInt(duckCount);
    
    calculateEditQuality();
}

function calculateEditQuality() {
    const total = parseInt(document.getElementById('editTotalEggs').value) || 0;
    const good = parseInt(document.getElementById('editGoodEggs').value) || 0;
    const duckCount = window.currentBatchDucks || 1;
    
    // Quality rate
    const qualityRate = total > 0 ? Math.round((good / total) * 100) : 0;
    document.getElementById('editQualityRate').textContent = qualityRate + '%';
    
    // Production rate
    const productionRate = duckCount > 0 ? Math.round((total / duckCount) * 100) : 0;
    document.getElementById('editProductionRate').textContent = productionRate + '%';
    
    // Average per duck
    const avgPerDuck = duckCount > 0 ? (total / duckCount).toFixed(2) : '0.00';
    document.getElementById('editAvgPerDuck').textContent = avgPerDuck;
}

function updateEditBatchInfo() {
    const select = document.getElementById('editBatchId');
    const option = select.options[select.selectedIndex];
    const duckCount = option.dataset.count || 0;
    window.currentBatchDucks = parseInt(duckCount);
    calculateEditQuality();
}

function openEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.style.display = 'none';
    }
    window.editingCollectionId = null;
}

async function updateCollection(event) {
    event.preventDefault();
    
    if (!window.editingCollectionId) {
        showNotification('No collection selected for editing', 'error');
        return;
    }
    
    const formData = {
        collectionId: window.editingCollectionId,
        collectionDate: document.getElementById('editCollectionDate').value,
        batchId: document.getElementById('editBatchId').value,
        collectionTime: document.getElementById('editCollectionTime').value,
        totalEggs: document.getElementById('editTotalEggs').value,
        goodEggs: document.getElementById('editGoodEggs').value,
        crackedEggs: document.getElementById('editCrackedEggs').value,
        dirtyEggs: document.getElementById('editDirtyEggs').value,
        smallEggs: document.getElementById('editSmallEggs').value,
        weatherCondition: document.getElementById('editWeatherCondition').value,
        notes: document.getElementById('editNotes').value
    };
    
    // Validation
    const total = parseInt(formData.totalEggs);
    const sum = parseInt(formData.goodEggs) + parseInt(formData.crackedEggs) + 
                parseInt(formData.dirtyEggs) + parseInt(formData.smallEggs);
    
    if (sum > total) {
        showNotification('Sum of egg categories cannot exceed total eggs', 'error');
        return;
    }
    
    try {
        const response = await fetch('api/egg/update_egg_collection.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Collection updated successfully!', 'success');
            setTimeout(() => location.reload(), 1500);
        } else {
            showNotification(result.message || 'Error updating collection', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

// Delete collection
async function deleteCollection(collectionId) {
    if (!confirm('Are you sure you want to delete this collection record?')) {
        return;
    }
    
    try {
        const response = await fetch('api/egg/delete_egg_collection.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ collectionId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Collection deleted successfully', 'success');
            setTimeout(() => location.reload(), 1500);
        } else {
            showNotification(result.message || 'Error deleting collection', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Network error', 'error');
    }
}

// Export data
function exportEggData() {
    window.location.href = 'api/egg/export_eggs.php';
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type} show`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('editModal');
    if (event.target === modal) {
        closeEditModal();
    }
}