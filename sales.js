// assets/js/sale/sales.js - COMPLETE FIXED VERSION

// Global state
let availableSources = [];
let currentAvailableCount = 0;
let currentPage = 0;
let salesData = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Sales page initialized');
    loadSales();
    initializeEventListeners();
});

// Initialize event listeners
function initializeEventListeners() {
    // Search with debounce
    const searchInput = document.getElementById('filterSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => loadSales(), 500));
    }
    
    // Date validation
    const saleDate = document.getElementById('saleDate');
    if (saleDate) {
        saleDate.max = new Date().toISOString().split('T')[0];
    }
}

// Show/Hide loading overlay
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('active');
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('active');
}

// Show alert message
function showAlert(message, type = 'success') {
    const container = document.getElementById('alertContainer');
    if (!container) return;
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} show`;
    alert.innerHTML = `
        <strong>${type === 'success' ? '✅' : '❌'}</strong> ${message}
    `;
    container.appendChild(alert);
    
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 300);
    }, 5000);
}

// Scroll to form
function scrollToForm() {
    document.getElementById('salesForm')?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

// Handle product type change
async function handleProductTypeChange() {
    const productType = document.getElementById('productType').value;
    const batchRow = document.getElementById('batchRow');
    const batchSelect = document.getElementById('batchId');
    const unitSelect = document.getElementById('unit');
    const availableCount = document.getElementById('availableCount');
    const batchHint = document.getElementById('batchHint');
    
    console.log('Product type changed:', productType);
    
    // Reset state
    if (batchSelect) batchSelect.innerHTML = '<option value="">Loading...</option>';
    if (availableCount) availableCount.value = '0';
    if (batchHint) batchHint.textContent = '';
    currentAvailableCount = 0;
    
    // Handle product-specific logic
    if (productType === 'Ducks' || productType === 'Eggs') {
        if (batchRow) batchRow.style.display = 'flex';
        if (batchSelect) batchSelect.required = true;
        
        await loadAvailableSources(productType);
        
        if (unitSelect) {
            unitSelect.value = productType === 'Ducks' ? 'heads' : 'pieces';
        }
    } else {
        if (batchRow) batchRow.style.display = 'none';
        if (batchSelect) batchSelect.required = false;
        
        if (unitSelect) {
            unitSelect.value = productType === 'Fertilizer' ? 'kg' : 'pieces';
        }
    }
}

// Load available sources
async function loadAvailableSources(productType) {
    const batchSelect = document.getElementById('batchId');
    if (!batchSelect) return;
    
    try {
        const response = await fetch(`api/sale/get_available_sources.php?product_type=${productType}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            availableSources = data.sources || [];
            
            batchSelect.innerHTML = '<option value="">-- Select a batch --</option>';
            
            if (availableSources.length === 0) {
                batchSelect.innerHTML = '<option value="">No batches available</option>';
                const hint = document.getElementById('batchHint');
                if (hint) {
                    hint.textContent = '⚠️ No available ' + (productType === 'Ducks' ? 'ducks' : 'eggs');
                    hint.style.color = '#dc3545';
                }
            } else {
                availableSources.forEach(source => {
                    const option = document.createElement('option');
                    option.value = source.id;
                    option.textContent = source.display;
                    option.dataset.available = source.available;
                    batchSelect.appendChild(option);
                });
                
                if (availableSources.length === 1) {
                    batchSelect.value = availableSources[0].id;
                    updateAvailableCount();
                }
            }
        } else {
            throw new Error(data.message || 'Failed to load batches');
        }
    } catch (error) {
        console.error('Error loading sources:', error);
        batchSelect.innerHTML = '<option value="">Error loading batches</option>';
        showAlert('Failed to load batches: ' + error.message, 'error');
    }
}

// Update available count
function updateAvailableCount() {
    const batchSelect = document.getElementById('batchId');
    if (!batchSelect) return;
    
    const selectedOption = batchSelect.options[batchSelect.selectedIndex];
    const available = parseInt(selectedOption.dataset.available || 0);
    const productType = document.getElementById('productType').value;
    
    currentAvailableCount = available;
    
    const unit = productType === 'Ducks' ? 'ducks' : 'eggs';
    const availableCount = document.getElementById('availableCount');
    if (availableCount) {
        availableCount.value = available + ' ' + unit;
    }
    
    const hint = document.getElementById('batchHint');
    if (hint) {
        if (available > 0) {
            hint.textContent = `✓ ${available} ${unit} available`;
            hint.style.color = '#28a745';
        } else {
            hint.textContent = `⚠️ No ${unit} available`;
            hint.style.color = '#dc3545';
        }
    }
    
    validateQuantity();
}

// Calculate total
function calculateTotal() {
    const quantity = parseFloat(document.getElementById('quantity')?.value) || 0;
    const unitPrice = parseFloat(document.getElementById('unitPrice')?.value) || 0;
    const total = quantity * unitPrice;
    
    const totalAmount = document.getElementById('totalAmount');
    if (totalAmount) {
        totalAmount.value = total.toFixed(2);
    }
    
    validateQuantity();
}

// Validate quantity
function validateQuantity() {
    const productType = document.getElementById('productType')?.value;
    const quantityInput = document.getElementById('quantity');
    if (!quantityInput) return true;
    
    const quantity = parseInt(quantityInput.value) || 0;
    
    if ((productType === 'Ducks' || productType === 'Eggs') && quantity > currentAvailableCount) {
        quantityInput.style.borderColor = '#dc3545';
        quantityInput.style.backgroundColor = '#fff3cd';
        return false;
    } else {
        quantityInput.style.borderColor = '';
        quantityInput.style.backgroundColor = '';
        return true;
    }
}

// Reset form
function resetSaleForm() {
    document.getElementById('recordSaleForm')?.reset();
    document.getElementById('totalAmount').value = '0.00';
    document.getElementById('batchRow').style.display = 'none';
    document.getElementById('availableCount').value = '0';
    document.getElementById('batchHint').textContent = '';
    
    currentAvailableCount = 0;
    availableSources = [];
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('saleDate').value = today;
}

// Record sale
async function recordSale(event) {
    event.preventDefault();
    
    const productType = document.getElementById('productType').value;
    const quantity = parseInt(document.getElementById('quantity').value);
    const batchId = document.getElementById('batchId').value;
    
    // Validate
    if ((productType === 'Ducks' || productType === 'Eggs')) {
        if (!batchId) {
            showAlert('Please select a batch', 'error');
            return;
        }
        if (quantity > currentAvailableCount) {
            showAlert(`Only ${currentAvailableCount} available`, 'error');
            return;
        }
    }
    
    const formData = {
        saleDate: document.getElementById('saleDate').value,
        productType: productType,
        quantity: quantity,
        unit: document.getElementById('unit').value,
        unitPrice: parseFloat(document.getElementById('unitPrice').value),
        totalAmount: parseFloat(document.getElementById('totalAmount').value),
        batchId: batchId || null,
        customerName: document.getElementById('customerName').value.trim() || null,
        customerContact: document.getElementById('customerContact').value.trim() || null,
        paymentMethod: document.getElementById('paymentMethod').value,
        paymentStatus: document.getElementById('paymentStatus').value,
        notes: document.getElementById('saleNotes').value.trim() || null
    };
    
    showLoading();
    
    try {
        const response = await fetch('api/sale/add_sale.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showAlert(`✅ Sale recorded! Total: ₱${result.total_amount.toFixed(2)}`, 'success');
            resetSaleForm();
            loadSales();
            
            setTimeout(() => location.reload(), 2000);
        } else {
            showAlert('Error: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error recording sale:', error);
        showAlert('Failed to record sale: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Load sales - FIXED
async function loadSales(offset = 0) {
    const tbody = document.getElementById('salesTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="10" style="text-align:center; padding:2rem;">
                <div class="spinner" style="margin: 0 auto 1rem;"></div>
                Loading sales...
            </td>
        </tr>
    `;
    
    const search = document.getElementById('filterSearch')?.value || '';
    const productType = document.getElementById('filterProduct')?.value || '';
    const paymentStatus = document.getElementById('filterPayment')?.value || '';
    
    let url = `api/sale/get_sales.php?limit=50&offset=${offset}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (productType) url += `&product_type=${encodeURIComponent(productType)}`;
    if (paymentStatus) url += `&payment_status=${encodeURIComponent(paymentStatus)}`;
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response:', text);
            throw new Error('Server returned non-JSON response');
        }
        
        const result = await response.json();
        
        if (result.success) {
            salesData = result.data || [];
            currentPage = offset;
            renderSalesTable(result.data || []);
            renderPagination(result.total || 0, result.limit || 50, offset);
        } else {
            throw new Error(result.message || 'Unknown error');
        }
    } catch (error) {
        console.error('Error loading sales:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align:center; padding:2rem;">
                    <div style="color:#dc3545; margin-bottom:1rem;">❌ ${error.message}</div>
                    <button onclick="loadSales()" class="btn btn-secondary">🔄 Retry</button>
                </td>
            </tr>
        `;
    }
}

// Render table
function renderSalesTable(sales) {
    const tbody = document.getElementById('salesTableBody');
    if (!tbody) return;
    
    if (!sales || sales.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align:center; padding:2rem; color:#666;">
                    📋 No sales found
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = sales.map(sale => `
        <tr>
            <td style="white-space:nowrap;">${sale.sale_date_formatted}</td>
            <td><strong>${sale.product_type}</strong></td>
            <td title="${sale.source_info || 'N/A'}">${sale.source_info || '<em style="color:#999;">N/A</em>'}</td>
            <td><strong>${sale.quantity} ${sale.unit}</strong></td>
            <td>₱${sale.unit_price.toFixed(2)}</td>
            <td><strong style="color:#28a745;">₱${sale.total_amount.toFixed(2)}</strong></td>
            <td title="${sale.customer_name}">${sale.customer_name}</td>
            <td>${sale.payment_method}</td>
            <td><span class="status-badge status-${sale.payment_status.toLowerCase()}">${sale.payment_status}</span></td>
            <td style="white-space:nowrap;">
                <button class="btn-icon" onclick="viewSale(${sale.sale_id})" title="View">👁️</button>
                <button class="btn-icon" onclick="deleteSale(${sale.sale_id})" title="Delete" style="color:#dc3545;">🗑️</button>
            </td>
        </tr>
    `).join('');
}

// Render pagination
function renderPagination(total, limit, offset) {
    const container = document.getElementById('paginationContainer');
    if (!container) return;
    
    const totalPages = Math.ceil(total / limit);
    const currentPageNum = Math.floor(offset / limit) + 1;
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '<div style="display:flex; gap:0.5rem; align-items:center; justify-content:center;">';
    
    if (currentPageNum > 1) {
        html += `<button class="btn btn-secondary" onclick="loadSales(${(currentPageNum - 2) * limit})">← Previous</button>`;
    }
    
    html += `<span style="padding:0.5rem 1rem; background:#f8f9fa; border-radius:4px;">Page ${currentPageNum} of ${totalPages}</span>`;
    
    if (currentPageNum < totalPages) {
        html += `<button class="btn btn-secondary" onclick="loadSales(${currentPageNum * limit})">Next →</button>`;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

// Clear filters
function clearFilters() {
    document.getElementById('filterSearch').value = '';
    document.getElementById('filterProduct').value = '';
    document.getElementById('filterPayment').value = '';
    loadSales();
}

// View sale
function viewSale(saleId) {
    const sale = salesData.find(s => s.sale_id === saleId);
    if (!sale) {
        showAlert('Sale not found', 'error');
        return;
    }
    
    const details = `
═══════════════════════════
       SALE DETAILS
═══════════════════════════

📅 Date: ${sale.sale_date_formatted}
📦 Product: ${sale.product_type}
🏷️ Source: ${sale.source_info || 'N/A'}

📊 Quantity: ${sale.quantity} ${sale.unit}
💵 Unit Price: ₱${sale.unit_price.toFixed(2)}
💰 Total: ₱${sale.total_amount.toFixed(2)}

👤 Customer: ${sale.customer_name}
📞 Contact: ${sale.customer_contact || 'N/A'}

💳 Payment: ${sale.payment_method}
✅ Status: ${sale.payment_status}

📝 Notes: ${sale.notes || 'None'}
    `;
    
    alert(details);
}

// Delete sale
async function deleteSale(saleId) {
    const sale = salesData.find(s => s.sale_id === saleId);
    if (!sale) return;
    
    if (!confirm(`Delete this sale?\n\n${sale.product_type}: ${sale.quantity} ${sale.unit}\nAmount: ₱${sale.total_amount.toFixed(2)}\n\n⚠️ This cannot be undone!`)) {
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch('api/sale/delete_sale.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sale_id: saleId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('✅ Sale deleted', 'success');
            loadSales(currentPage);
            setTimeout(() => location.reload(), 1500);
        } else {
            showAlert('Error: ' + result.message, 'error');
        }
    } catch (error) {
        showAlert('Failed to delete sale', 'error');
    } finally {
        hideLoading();
    }
}

// Export sales
function exportSales() {
    const search = document.getElementById('filterSearch')?.value || '';
    const productType = document.getElementById('filterProduct')?.value || '';
    const paymentStatus = document.getElementById('filterPayment')?.value || '';
    
    let url = 'api/sale/export_sales.php?';
    const params = [];
    
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (productType) params.push(`product_type=${encodeURIComponent(productType)}`);
    if (paymentStatus) params.push(`payment_status=${encodeURIComponent(paymentStatus)}`);
    
    window.open(url + params.join('&'), '_blank');
    showAlert('📥 Export starting...', 'success');
}

// Debounce utility
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

console.log('✅ Sales.js loaded successfully!');