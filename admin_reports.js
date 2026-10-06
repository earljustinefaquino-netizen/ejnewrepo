/**
 * Reports Page JavaScript - Fixed with Auto Download
 * File: assets/js/admin_reports.js
 */

// ===========================
// GLOBAL VARIABLES
// ===========================
let selectedFarmerId = 'all';

// ===========================
// INITIALIZATION
// ===========================
document.addEventListener('DOMContentLoaded', function() {
    initReports();
    setupFarmerSelector();
});

function initReports() {
    console.log('📊 Reports page initialized');
    initKeyboardShortcuts();
    updateReportStats();
}

function setupFarmerSelector() {
    const farmerSelect = document.getElementById('farmerSelect');
    if (farmerSelect) {
        farmerSelect.addEventListener('change', function() {
            selectedFarmerId = this.value;
            updateReportStats();
        });
    }
}

// ===========================
// REPORT GENERATION FUNCTIONS
// ===========================

/**
 * Generate Sales Report - Opens in new window for auto-download
 */
function generateSalesReport() {
    const farmerName = getSelectedFarmerName();
    generateReport('sales', `Sales Report - ${farmerName}`);
}

/**
 * Generate Production Report
 */
function generateProductionReport() {
    const farmerName = getSelectedFarmerName();
    generateReport('production', `Production Report - ${farmerName}`);
}

/**
 * Generate Inventory Report
 */
function generateInventoryReport() {
    const farmerName = getSelectedFarmerName();
    generateReport('inventory', `Inventory Report - ${farmerName}`);
}

/**
 * Generate Farmer Performance Report
 */
function generateFarmerReport() {
    const farmerName = getSelectedFarmerName();
    generateReport('farmer', `Farmer Performance Report - ${farmerName}`);
}

/**
 * Generate Financial Summary Report
 */
function generateFinancialReport() {
    const farmerName = getSelectedFarmerName();
    generateReport('financial', `Financial Summary Report - ${farmerName}`);
}

/**
 * Generate Loss Analysis Report
 */
function generateLossReport() {
    const farmerName = getSelectedFarmerName();
    generateReport('loss', `Loss Analysis Report - ${farmerName}`);
}

/**
 * Generic report generation function - Opens in new window
 * @param {string} reportType - Type of report to generate
 * @param {string} reportName - Display name of the report
 */
function generateReport(reportType, reportName) {
    showNotification(`Generating ${reportName}...`, 'info');
    
    // Build URL with parameters
    const url = `../api/admin/generate_report.php?type=${reportType}&format=pdf&farmer_id=${selectedFarmerId}`;
    
    // Open in new window - will auto-trigger print dialog
    const reportWindow = window.open(url, '_blank', 'width=1200,height=800');
    
    if (reportWindow) {
        showSuccessMessage(`${reportName} opened successfully! Use Ctrl+P to save as PDF.`);
    } else {
        showErrorMessage('Please allow pop-ups for this site to view reports.');
    }
}

/**
 * Generate CSV Report
 * @param {string} reportType - Type of report to generate
 */
function generateCSVReport(reportType) {
    showNotification('Generating CSV report...', 'info');
    
    const url = `../api/admin/generate_report.php?type=${reportType}&format=csv&farmer_id=${selectedFarmerId}`;
    
    // Create temporary link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report_${getFormattedDate()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    showSuccessMessage('CSV report download started!');
}

// ===========================
// STATISTICS UPDATE
// ===========================

/**
 * Update report statistics based on selected farmer
 */
async function updateReportStats() {
    try {
        const url = `../api/admin/report_stats.php?farmer_id=${selectedFarmerId}`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error('Failed to fetch stats');
        
        const stats = await response.json();
        
        // Update UI with new stats
        updateStatsUI(stats);
        
        console.log('Report stats updated for farmer:', selectedFarmerId);
    } catch (error) {
        console.error('Failed to update report stats:', error);
    }
}

/**
 * Update stats UI elements
 */
function updateStatsUI(stats) {
    // Update sales stat
    const salesStat = document.getElementById('salesStat');
    if (salesStat && stats.sales) {
        salesStat.innerHTML = `
            <i class="fas fa-coins"></i>
            ₱${formatNumber(stats.sales.total_revenue)} This Month
        `;
    }
    
    // Update production stat
    const productionStat = document.getElementById('productionStat');
    if (productionStat && stats.production) {
        productionStat.innerHTML = `
            <i class="fas fa-egg"></i>
            ${formatNumber(stats.production.total_eggs)} Eggs This Month
        `;
    }
    
    // Update inventory stat
    const inventoryStat = document.getElementById('inventoryStat');
    if (inventoryStat && stats.inventory) {
        inventoryStat.innerHTML = `
            <i class="fas fa-layer-group"></i>
            ${formatNumber(stats.inventory.total_batches)} Active Batches
        `;
    }
    
    // Update farmer stat
    const farmerStat = document.getElementById('farmerStat');
    if (farmerStat && stats.farmers) {
        farmerStat.innerHTML = `
            <i class="fas fa-users-cog"></i>
            ${formatNumber(stats.farmers.total_farmers)} Active Farmers
        `;
    }
    
    // Update loss stat
    const lossStat = document.getElementById('lossStat');
    if (lossStat && stats.losses) {
        lossStat.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            ${formatNumber(stats.losses.total_losses)} Losses This Month
        `;
    }
}

/**
 * Refresh report statistics
 */
function refreshReportStats() {
    showLoading('Refreshing statistics...');
    updateReportStats().then(() => {
        hideLoading();
        showSuccessMessage('Statistics refreshed successfully!');
    }).catch(() => {
        hideLoading();
        showErrorMessage('Failed to refresh statistics');
    });
}

// ===========================
// CUSTOM REPORT BUILDER
// ===========================

/**
 * Open custom report builder modal
 */
function openCustomReportBuilder() {
    showInfoMessage('Custom report builder feature coming soon!');
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

/**
 * Get selected farmer name
 */
function getSelectedFarmerName() {
    const farmerSelect = document.getElementById('farmerSelect');
    if (!farmerSelect) return 'All Farmers';
    
    const selectedOption = farmerSelect.options[farmerSelect.selectedIndex];
    return selectedOption.text;
}

/**
 * Format number with commas
 */
function formatNumber(num) {
    if (!num) return '0';
    return parseFloat(num).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

/**
 * Get formatted date for filenames
 * @returns {string} Formatted date (YYYYMMDD_HHMMSS)
 */
function getFormattedDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

/**
 * Print current reports page
 */
function printReports() {
    window.print();
}

/**
 * Refresh page
 */
function refreshPage() {
    window.location.reload();
}

// ===========================
// UI FEEDBACK FUNCTIONS
// ===========================

/**
 * Show loading overlay
 */
function showLoading(message = 'Loading...') {
    let overlay = document.getElementById('loadingOverlay');
    
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>${message}</p>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    
    overlay.querySelector('p').textContent = message;
    overlay.classList.add('active');
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

/**
 * Show success message
 */
function showSuccessMessage(message) {
    showAlert(message, 'success');
}

/**
 * Show error message
 */
function showErrorMessage(message) {
    showAlert(message, 'error');
}

/**
 * Show info message
 */
function showInfoMessage(message) {
    showAlert(message, 'info');
}

/**
 * Show notification (alias)
 */
function showNotification(message, type = 'info') {
    showAlert(message, type);
}

/**
 * Show alert notification
 */
function showAlert(message, type = 'success') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    
    const icon = icons[type] || icons.info;
    alert.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
    
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        gap: 1rem;
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        max-width: 400px;
        font-weight: 500;
    `;
    
    // Type-specific styles
    const colors = {
        success: { bg: '#d4edda', color: '#155724', border: '#28a745' },
        error: { bg: '#f8d7da', color: '#721c24', border: '#dc3545' },
        info: { bg: '#d1ecf1', color: '#0c5460', border: '#17a2b8' }
    };
    
    const style = colors[type] || colors.info;
    alert.style.background = style.bg;
    alert.style.color = style.color;
    alert.style.borderLeft = `4px solid ${style.border}`;
    
    document.body.appendChild(alert);
    
    // Auto remove
    const duration = type === 'error' ? 5000 : 3000;
    setTimeout(() => {
        alert.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => alert.remove(), 300);
    }, duration);
}

// ===========================
// KEYBOARD SHORTCUTS
// ===========================

/**
 * Initialize keyboard shortcuts
 */
function initKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + P for print
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            printReports();
        }
        
        // Ctrl/Cmd + R for refresh
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            refreshPage();
        }
    });
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
    
    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(5px);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    }
    
    .loading-overlay.active {
        display: flex;
    }
    
    .loading-spinner {
        background: white;
        padding: 3rem;
        border-radius: 16px;
        text-align: center;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    }
    
    .loading-spinner i {
        font-size: 3rem;
        color: #4a7c59;
        margin-bottom: 1rem;
    }
    
    .loading-spinner p {
        color: #333;
        font-weight: 600;
        font-size: 1.1rem;
        margin: 0;
    }
`;
document.head.appendChild(style);

console.log('✅ Admin Reports JavaScript Loaded Successfully');