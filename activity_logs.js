/**
 * Activity Logs JavaScript - Professional Version
 * File: assets/js/activity_logs.js
 */

// ===========================
// PAGINATION FUNCTIONS
// ===========================

/**
 * Navigate to a specific page
 * @param {number} page - Page number to navigate to
 */
function goToPage(page) {
    const url = new URL(window.location.href);
    url.searchParams.set('page', page);
    window.location.href = url.toString();
}

// ===========================
// EXPORT FUNCTIONS
// ===========================

/**
 * Export activity logs to CSV format
 */
async function exportToCSV() {
    showLoading('Preparing CSV export...');
    
    try {
        const params = new URLSearchParams(window.location.search);
        params.set('export', 'csv');
        
        // Path: from admin/ folder -> up to root -> into api/admin/
        const response = await fetch(`../api/admin/export_logs.php?${params.toString()}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Export error response:', errorText);
            throw new Error(`Export failed: ${response.status}`);
        }
        
        const blob = await response.blob();
        downloadFile(blob, `activity_logs_${getFormattedDate()}.csv`);
        
        hideLoading();
        showSuccessMessage('CSV export completed successfully');
    } catch (error) {
        hideLoading();
        showErrorMessage('Failed to export logs: ' + error.message);
        console.error('Export error:', error);
    }
}

/**
 * Export activity logs to PDF format
 */
async function exportToPDF() {
    showLoading('Preparing PDF export...');
    
    try {
        const params = new URLSearchParams(window.location.search);
        params.set('export', 'pdf');
        
        // Path: from admin/ folder -> up to root -> into api/admin/
        const response = await fetch(`../api/admin/export_logs.php?${params.toString()}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Export error response:', errorText);
            throw new Error(`Export failed: ${response.status}`);
        }
        
        const blob = await response.blob();
        downloadFile(blob, `activity_logs_${getFormattedDate()}.pdf`);
        
        hideLoading();
        showSuccessMessage('PDF export completed successfully');
    } catch (error) {
        hideLoading();
        showErrorMessage('Failed to export logs: ' + error.message);
        console.error('Export error:', error);
    }
}

/**
 * Download a file blob
 * @param {Blob} blob - File blob to download
 * @param {string} filename - Name of the file
 */
function downloadFile(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

/**
 * Print the activity logs
 */
function printLogs() {
    window.print();
}

/**
 * Refresh the activity logs page
 */
function refreshLogs() {
    showLoading('Refreshing activity logs...');
    window.location.reload();
}

/**
 * Clear all active filters
 */
function clearFilters() {
    window.location.href = 'activity_logs.php';
}

/**
 * Get formatted date string for filenames
 * @returns {string} Formatted date (YYYYMMDD_HHMM)
 */
function getFormattedDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}${month}${day}_${hours}${minutes}`;
}

// ===========================
// FILTER FUNCTIONS
// ===========================

/**
 * Filter logs by date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 */
function filterByDateRange(startDate, endDate) {
    const url = new URL(window.location.href);
    url.searchParams.set('start_date', startDate);
    url.searchParams.set('end_date', endDate);
    url.searchParams.delete('date');
    window.location.href = url.toString();
}

/**
 * Search activity logs
 * @param {string} searchTerm - Search term
 */
function searchLogs(searchTerm) {
    const url = new URL(window.location.href);
    if (searchTerm) {
        url.searchParams.set('search', searchTerm);
    } else {
        url.searchParams.delete('search');
    }
    url.searchParams.set('page', '1');
    window.location.href = url.toString();
}

/**
 * Highlight search terms in activity descriptions
 */
function highlightSearchTerms() {
    const params = new URLSearchParams(window.location.search);
    const searchTerm = params.get('search');
    
    if (searchTerm) {
        const descriptions = document.querySelectorAll('.activity-timeline-description');
        descriptions.forEach(desc => {
            const text = desc.textContent;
            const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
            const highlightedText = text.replace(regex, '<mark style="background-color: #fef08a; padding: 0.1rem 0.3rem; border-radius: 3px;">$1</mark>');
            desc.innerHTML = highlightedText;
        });
    }
}

/**
 * Escape special regex characters
 * @param {string} string - String to escape
 * @returns {string} Escaped string
 */
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ===========================
// UI FEEDBACK FUNCTIONS
// ===========================

/**
 * Show loading overlay
 * @param {string} message - Loading message
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
 * @param {string} message - Success message
 */
function showSuccessMessage(message) {
    showAlert(message, 'success');
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showErrorMessage(message) {
    showAlert(message, 'error');
}

/**
 * Show alert message
 * @param {string} message - Alert message
 * @param {string} type - Alert type (success or error)
 */
function showAlert(message, type = 'success') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    alert.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
    
    document.body.appendChild(alert);
    
    // Slide in animation
    setTimeout(() => {
        alert.style.animation = 'slideIn 0.3s ease-out';
    }, 10);
    
    const duration = type === 'success' ? 3000 : 4000;
    setTimeout(() => {
        alert.style.opacity = '0';
        alert.style.transition = 'opacity 0.3s ease-out';
        setTimeout(() => alert.remove(), 300);
    }, duration);
}

// ===========================
// AUTO-REFRESH FUNCTIONS
// ===========================

/**
 * Toggle auto-refresh feature
 */
function toggleAutoRefresh() {
    const current = localStorage.getItem('activity_logs_auto_refresh');
    const newValue = current === 'true' ? 'false' : 'true';
    localStorage.setItem('activity_logs_auto_refresh', newValue);
    
    if (newValue === 'true') {
        showSuccessMessage('Auto-refresh enabled (every 30 seconds)');
        setTimeout(() => window.location.reload(), 100);
    } else {
        showSuccessMessage('Auto-refresh disabled');
    }
}

/**
 * Initialize auto-refresh if enabled
 */
function initAutoRefresh() {
    const autoRefresh = localStorage.getItem('activity_logs_auto_refresh');
    if (autoRefresh === 'true') {
        setInterval(() => {
            refreshLogs();
        }, 30000);
    }
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
            printLogs();
        }
        
        // Ctrl/Cmd + E for export
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            exportToCSV();
        }
        
        // Ctrl/Cmd + R for refresh
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            refreshLogs();
        }
        
        // ESC to clear filters
        if (e.key === 'Escape') {
            const params = new URLSearchParams(window.location.search);
            if (params.toString()) {
                clearFilters();
            }
        }
    });
}

// ===========================
// INITIALIZATION
// ===========================

/**
 * Initialize all features on page load
 */
function initActivityLogs() {
    // Highlight search terms if any
    highlightSearchTerms();
    
    // Initialize keyboard shortcuts
    initKeyboardShortcuts();
    
    // Initialize auto-refresh
    initAutoRefresh();
    
    // Log successful initialization
    console.log('Activity Logs initialized successfully');
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initActivityLogs);
} else {
    initActivityLogs();
}