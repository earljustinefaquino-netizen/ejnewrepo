// feed.js - Complete Feed Inventory Management (Fixed with Global Functions)

let currentEditFeedId = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeSearch();
    loadFeedInventory();
    
    const form = document.getElementById('feedPurchaseForm');
    if (form) {
        form.addEventListener('submit', handleFeedFormSubmit);
    }
    
    const quantityField = document.getElementById('quantityBags');
    const costField = document.getElementById('costPerBag');
    
    if (quantityField) quantityField.addEventListener('input', calculateTotal);
    if (costField) costField.addEventListener('input', calculateTotal);
    
    const purchaseDate = document.getElementById('purchaseDate');
    if (purchaseDate && !purchaseDate.value) {
        purchaseDate.value = new Date().toISOString().split('T')[0];
    }
});

// Load all feed inventory
async function loadFeedInventory() {
    try {
        const response = await fetch('api/feed/get_all_feeds.php');
        const result = await response.json();
        
        if (result.success) {
            displayFeeds(result.feeds);
            updateSummary(result.summary);
        } else {
            showNotification('Error loading feed inventory: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error loading feeds:', error);
        showNotification('Error loading feed inventory', 'error');
    }
}

// Display feeds in table
function displayFeeds(feeds) {
    const tbody = document.getElementById('feedTableBody');
    if (!tbody) return;
    
    if (feeds.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="text-center">No feed records found</td></tr>';
        return;
    }
    
    tbody.innerHTML = feeds.map(feed => `
        <tr class="feed-row" data-type="${feed.feed_type}" data-status="${feed.status}" data-date="${feed.purchase_date}">
            <td>${feed.feed_id}</td>
            <td>${feed.feed_type}</td>
            <td>${feed.feed_brand || 'N/A'}</td>
            <td>${feed.quantity_bags}</td>
            <td>${feed.weight_per_bag} kg</td>
            <td>₱${parseFloat(feed.cost_per_bag).toFixed(2)}</td>
            <td>₱${parseFloat(feed.total_cost).toFixed(2)}</td>
            <td>${new Date(feed.purchase_date).toLocaleDateString()}</td>
            <td><span class="status-badge status-${feed.status.toLowerCase().replace(' ', '-')}">${feed.status}</span></td>
            <td>
                <button onclick="window.viewFeedDetails(${feed.feed_id})" class="btn-action btn-view" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="window.editFeed(${feed.feed_id})" class="btn-action btn-edit" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="window.deleteFeed(${feed.feed_id})" class="btn-action btn-delete" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
                ${parseInt(feed.quantity_bags) > 0 ? `
                <button onclick="window.openUsageModal(${feed.feed_id}, ${feed.quantity_bags})" class="btn-action btn-use" title="Record Usage">
                    <i class="fas fa-minus-circle"></i>
                </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

// Update summary statistics
function updateSummary(summary) {
    const totalBags = document.getElementById('totalBags');
    const totalValue = document.getElementById('totalValue');
    const lowStockCount = document.getElementById('lowStockCount');
    
    if (totalBags) totalBags.textContent = summary.total_bags || 0;
    if (totalValue) totalValue.textContent = '₱' + parseFloat(summary.total_value || 0).toFixed(2);
    if (lowStockCount) lowStockCount.textContent = summary.low_stock_count || 0;
}

// Search functionality
function initializeSearch() {
    const searchInput = document.getElementById('searchFeed');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            filterFeedRows(searchTerm);
        });
    }
}

function filterFeedRows(searchTerm) {
    const rows = document.querySelectorAll('.feed-row');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Filter functionality
function filterInventory() {
    const typeFilter = document.getElementById('filterType')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('filterStatus')?.value || '';
    const dateFrom = document.getElementById('filterDateFrom')?.value || '';
    const dateTo = document.getElementById('filterDateTo')?.value || '';
    
    const rows = document.querySelectorAll('.feed-row');
    
    rows.forEach(row => {
        const type = row.dataset.type.toLowerCase();
        const status = row.dataset.status;
        const date = row.dataset.date;
        
        let show = true;
        
        if (typeFilter && !type.includes(typeFilter)) show = false;
        if (statusFilter && status !== statusFilter) show = false;
        if (dateFrom && date < dateFrom) show = false;
        if (dateTo && date > dateTo) show = false;
        
        row.style.display = show ? '' : 'none';
    });
}

function clearFilters() {
    const filterType = document.getElementById('filterType');
    const filterStatus = document.getElementById('filterStatus');
    const filterDateFrom = document.getElementById('filterDateFrom');
    const filterDateTo = document.getElementById('filterDateTo');
    
    if (filterType) filterType.value = '';
    if (filterStatus) filterStatus.value = '';
    if (filterDateFrom) filterDateFrom.value = '';
    if (filterDateTo) filterDateTo.value = '';
    
    filterInventory();
}

// Modal management
function openAddFeedModal() {
    currentEditFeedId = null;
    const modal = document.getElementById('addFeedModal');
    if (modal) {
        modal.style.display = 'flex';
        const form = document.getElementById('feedPurchaseForm');
        if (form) form.reset();
        
        const modalTitle = modal.querySelector('.modal-header h3');
        if (modalTitle) modalTitle.textContent = 'Add New Feed Purchase';
        
        const purchaseDate = document.getElementById('purchaseDate');
        if (purchaseDate) {
            purchaseDate.value = new Date().toISOString().split('T')[0];
        }
    }
}

function closeAddFeedModal() {
    const modal = document.getElementById('addFeedModal');
    if (modal) {
        modal.style.display = 'none';
        const form = document.getElementById('feedPurchaseForm');
        if (form) form.reset();
        currentEditFeedId = null;
    }
}

// Calculate total cost
function calculateTotal() {
    const quantity = parseFloat(document.getElementById('quantityBags')?.value) || 0;
    const costPerBag = parseFloat(document.getElementById('costPerBag')?.value) || 0;
    const total = quantity * costPerBag;
    
    const totalCostField = document.getElementById('totalCost');
    if (totalCostField) {
        totalCostField.value = total.toFixed(2);
    }
}

// Handle form submission (Add or Update)
async function handleFeedFormSubmit(event) {
    event.preventDefault();

    const feedData = {
        purchaseDate: document.getElementById('purchaseDate')?.value,
        feedType: document.getElementById('feedType')?.value,
        feedBrand: document.getElementById('feedBrand')?.value || '',
        quantityBags: document.getElementById('quantityBags')?.value,
        weightPerBag: document.getElementById('weightPerBag')?.value,
        costPerBag: document.getElementById('costPerBag')?.value,
        totalCost: document.getElementById('totalCost')?.value,
        supplierName: document.getElementById('supplierName')?.value || '',
        supplierContact: document.getElementById('supplierContact')?.value || '',
        expiryDate: document.getElementById('expiryDate')?.value || '',
        notes: document.getElementById('feedNotes')?.value || ''
    };

    if (currentEditFeedId) {
        feedData.feedId = currentEditFeedId;
    }

    const endpoint = currentEditFeedId ? 'api/feed/update_feed.php' : 'api/feed/add_feed_purchase.php';
    const actionText = currentEditFeedId ? 'updated' : 'recorded';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(feedData)
        });

        const result = await response.json();
        
        if (result.success) {
            showNotification(`Feed purchase ${actionText} successfully!`, 'success');
            closeAddFeedModal();
            setTimeout(() => location.reload(), 1500);
        } else {
            showNotification(result.message || `Error ${actionText.replace('ed', 'ing')} feed purchase`, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

// HEADER RECORD USAGE BUTTON - Opens feed selection modal
window.recordFeedUsage = async function() {
    try {
        const response = await fetch('api/feed/get_all_feeds.php');
        const result = await response.json();
        
        if (!result.success || result.feeds.length === 0) {
            showNotification('No feed inventory found', 'error');
            return;
        }
        
        // Filter only feeds with quantity > 0
        const availableFeeds = result.feeds.filter(f => parseInt(f.quantity_bags) > 0);
        
        if (availableFeeds.length === 0) {
            showNotification('No feed available for usage recording', 'error');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'selectFeedModal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Select Feed to Record Usage</h3>
                    <button class="close" onclick="document.getElementById('selectFeedModal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="selectFeedId">Choose Feed:</label>
                        <select id="selectFeedId" class="form-control" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem;">
                            <option value="">Select a feed...</option>
                            ${availableFeeds.map(feed => `
                                <option value="${feed.feed_id}" data-quantity="${feed.quantity_bags}">
                                    ${feed.feed_type} ${feed.feed_brand ? '(' + feed.feed_brand + ')' : ''} - ${feed.quantity_bags} bags available
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                <div class="modal-actions" style="display: flex; gap: 1rem; justify-content: flex-end; padding: 1rem; border-top: 1px solid #eee;">
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('selectFeedModal').remove()">Cancel</button>
                    <button type="button" class="btn btn-primary" onclick="window.openUsageFromSelection()">Continue</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error loading feeds', 'error');
    }
}

// Open usage modal from feed selection
window.openUsageFromSelection = function() {
    const selectEl = document.getElementById('selectFeedId');
    const feedId = selectEl.value;
    const quantity = selectEl.options[selectEl.selectedIndex].dataset.quantity;
    
    if (!feedId) {
        showNotification('Please select a feed', 'error');
        return;
    }
    
    document.getElementById('selectFeedModal').remove();
    window.openUsageModal(parseInt(feedId), parseInt(quantity));
}

// View feed details - MUST BE GLOBAL
window.viewFeedDetails = async function(feedId) {
    try {
        const response = await fetch(`api/feed/get_feed.php?id=${feedId}`);
        const result = await response.json();
        
        if (result.success) {
            showFeedDetailsModal(result.data);
        } else {
            showNotification('Error loading feed details', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Network error', 'error');
    }
}

// Edit feed - MUST BE GLOBAL
window.editFeed = async function(feedId) {
    try {
        const response = await fetch(`api/feed/get_feed.php?id=${feedId}`);
        const result = await response.json();
        
        if (result.success) {
            currentEditFeedId = feedId;
            populateFeedForm(result.data);
            
            const modal = document.getElementById('addFeedModal');
            if (modal) {
                modal.style.display = 'flex';
                
                const modalTitle = modal.querySelector('.modal-header h3');
                if (modalTitle) modalTitle.textContent = 'Edit Feed Purchase';
            }
        } else {
            showNotification('Error loading feed data', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Network error', 'error');
    }
}

function populateFeedForm(data) {
    if (document.getElementById('purchaseDate')) document.getElementById('purchaseDate').value = data.purchase_date;
    if (document.getElementById('feedType')) document.getElementById('feedType').value = data.feed_type;
    if (document.getElementById('feedBrand')) document.getElementById('feedBrand').value = data.feed_brand || '';
    if (document.getElementById('quantityBags')) document.getElementById('quantityBags').value = data.quantity_bags;
    if (document.getElementById('weightPerBag')) document.getElementById('weightPerBag').value = data.weight_per_bag;
    if (document.getElementById('costPerBag')) document.getElementById('costPerBag').value = data.cost_per_bag;
    if (document.getElementById('totalCost')) document.getElementById('totalCost').value = data.total_cost;
    if (document.getElementById('supplierName')) document.getElementById('supplierName').value = data.supplier_name || '';
    if (document.getElementById('supplierContact')) document.getElementById('supplierContact').value = data.supplier_contact || '';
    if (document.getElementById('expiryDate')) document.getElementById('expiryDate').value = data.expiry_date || '';
    if (document.getElementById('feedNotes')) document.getElementById('feedNotes').value = data.notes || '';
}

// Delete feed - MUST BE GLOBAL
window.deleteFeed = async function(feedId) {
    if (!confirm('Are you sure you want to delete this feed record? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch('api/feed/delete_feed.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ feedId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Feed record deleted successfully', 'success');
            setTimeout(() => location.reload(), 1500);
        } else {
            showNotification(result.message || 'Error deleting feed', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Network error', 'error');
    }
}

// Open usage modal - MUST BE GLOBAL
window.openUsageModal = function(feedId, currentQuantity) {
    console.log('Opening usage modal for feed:', feedId, 'quantity:', currentQuantity);
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'usageModal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Record Feed Usage</h3>
                <button class="close" onclick="window.closeUsageModal()">&times;</button>
            </div>
            <div class="modal-body">
                <p><strong>Current Stock:</strong> ${currentQuantity} bags</p>
                <form id="usageForm" onsubmit="window.recordUsage(event, ${feedId}); return false;">
                    <div class="form-group">
                        <label for="usedQuantity">Bags Used:</label>
                        <input type="number" id="usedQuantity" min="1" max="${currentQuantity}" required>
                    </div>
                    <div class="form-group">
                        <label for="usageNotes">Notes (Optional):</label>
                        <textarea id="usageNotes" rows="3"></textarea>
                    </div>
                    <div class="form-actions" style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1rem;">
                        <button type="button" onclick="window.closeUsageModal()" class="btn btn-secondary">Cancel</button>
                        <button type="submit" class="btn btn-primary">Record Usage</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Close usage modal - MUST BE GLOBAL
window.closeUsageModal = function() {
    const modal = document.getElementById('usageModal');
    if (modal) modal.remove();
}

// Record usage submission - MUST BE GLOBAL
window.recordUsage = async function(event, feedId) {
    event.preventDefault();
    
    const usedQuantity = parseInt(document.getElementById('usedQuantity')?.value) || 0;
    
    if (usedQuantity <= 0) {
        showNotification('Please enter a valid quantity', 'error');
        return;
    }
    
    try {
        const response = await fetch('api/feed/feed_usage.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                feedId: feedId,
                usedQuantity: usedQuantity
            })
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Feed usage recorded successfully!', 'success');
            window.closeUsageModal();
            setTimeout(() => location.reload(), 1500);
        } else {
            showNotification(result.message || 'Error recording feed usage', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

// Show feed details modal
function showFeedDetailsModal(data) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Feed Details</h3>
                <button class="close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="detail-grid">
                    <div class="detail-row">
                        <strong>Feed Type:</strong>
                        <span>${data.feed_type}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Brand:</strong>
                        <span>${data.feed_brand || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Quantity:</strong>
                        <span>${data.quantity_bags} bags</span>
                    </div>
                    <div class="detail-row">
                        <strong>Weight/Bag:</strong>
                        <span>${data.weight_per_bag} kg</span>
                    </div>
                    <div class="detail-row">
                        <strong>Total Weight:</strong>
                        <span>${(data.quantity_bags * data.weight_per_bag).toFixed(2)} kg</span>
                    </div>
                    <div class="detail-row">
                        <strong>Cost/Bag:</strong>
                        <span>₱${parseFloat(data.cost_per_bag).toFixed(2)}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Total Cost:</strong>
                        <span>₱${parseFloat(data.total_cost).toFixed(2)}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Supplier:</strong>
                        <span>${data.supplier_name || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Contact:</strong>
                        <span>${data.supplier_contact || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Purchase Date:</strong>
                        <span>${new Date(data.purchase_date).toLocaleDateString()}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Expiry Date:</strong>
                        <span>${data.expiry_date ? new Date(data.expiry_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Status:</strong>
                        <span class="status-badge status-${data.status.toLowerCase().replace(' ', '-')}">${data.status}</span>
                    </div>
                    ${data.notes ? `
                    <div class="detail-row full-width">
                        <strong>Notes:</strong>
                        <span>${data.notes}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
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
    const modal = document.getElementById('addFeedModal');
    if (event.target === modal) {
        closeAddFeedModal();
    }
    
    const usageModal = document.getElementById('usageModal');
    if (event.target === usageModal) {
        window.closeUsageModal();
    }
    
    const selectModal = document.getElementById('selectFeedModal');
    if (event.target === selectModal) {
        selectModal.remove();
    }
}