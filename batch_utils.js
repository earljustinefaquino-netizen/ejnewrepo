// assets/js/batch/batch_utils.js
// Shared utility functions for batch management

// Modal Management
export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        // Reset form if it exists
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// Loading Overlay
export function showLoading() {
    let loader = document.getElementById('loadingOverlay');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'loadingOverlay';
        loader.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); 
                        display: flex; justify-content: center; align-items: center; z-index: 9999;">
                <div style="background: white; padding: 2rem 3rem; border-radius: 15px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                    <div style="border: 4px solid #f3f3f3; border-top: 4px solid #4a7c59; border-radius: 50%; 
                                width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                    <p style="color: #4a7c59; font-weight: 600; margin: 0;">Loading...</p>
                </div>
            </div>
        `;
        document.body.appendChild(loader);
    }
    loader.style.display = 'block';
}

export function hideLoading() {
    const loader = document.getElementById('loadingOverlay');
    if (loader) {
        loader.style.display = 'none';
    }
}

// Notification System
export function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    
    notification.innerHTML = `
        <span><strong>${icons[type] || 'ℹ'}</strong> ${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Export function
export async function exportBatches() {
    showLoading();
    try {
        window.open('api/batch/export_batch_pdf.php', '_blank');
        setTimeout(() => {
            hideLoading();
            showNotification('Export started. Check your downloads.', 'success');
        }, 1000);
    } catch (error) {
        console.error('Error:', error);
        hideLoading();
        showNotification('Export failed. Please try again.', 'error');
    }
}

// Initialize styles
export function initializeStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .notification {
            position: fixed;
            top: 20px;
            right: -400px;
            background: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 1rem;
            min-width: 300px;
            max-width: 500px;
            transition: right 0.3s ease;
        }
        
        .notification.show {
            right: 20px;
        }
        
        .notification-success { border-left: 4px solid #28a745; }
        .notification-error { border-left: 4px solid #dc3545; }
        .notification-warning { border-left: 4px solid #ffc107; }
        .notification-info { border-left: 4px solid #17a2b8; }
        
        .notification button {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #6c757d;
            margin-left: auto;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s;
        }
        
        .notification button:hover {
            background: #f8f9fa;
            color: #333;
        }
        
        .detail-item {
            display: grid;
            grid-template-columns: 180px 1fr;
            gap: 1rem;
            padding: 0.75rem;
            border-bottom: 1px solid #e9ecef;
        }
        
        .detail-item:last-child {
            border-bottom: none;
        }
        
        .detail-item strong {
            color: var(--primary-green);
            font-weight: 600;
        }
    `;
    document.head.appendChild(style);
}