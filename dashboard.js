// dashboard.js - Complete Dashboard Management

// Dashboard State
const DashboardState = {
    charts: {
        eggProduction: null,
        healthStatus: null,
        feedInventory: null
    },
    refreshInterval: null
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDateTime();
    initializeCharts();
    initializeSearch();
    startAutoRefresh();
});

// Date and Time Display
function initializeDateTime() {
    function updateDateTime() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        const dateTimeElement = document.getElementById('currentDateTime');
        if (dateTimeElement) {
            dateTimeElement.textContent = now.toLocaleDateString('en-US', options);
        }
    }
    
    updateDateTime();
    setInterval(updateDateTime, 60000); // Update every minute
}

// Initialize Charts
function initializeCharts() {
    // Egg Production Chart
    const eggCtx = document.getElementById('eggProductionChart');
    if (eggCtx) {
        DashboardState.charts.eggProduction = new Chart(eggCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Eggs Collected',
                    data: [120, 145, 130, 165, 150, 140, 155],
                    borderColor: '#4a7c59',
                    backgroundColor: 'rgba(74, 124, 89, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointBackgroundColor: '#4a7c59'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 50
                        }
                    }
                }
            }
        });
    }

    // Health Status Pie Chart
    const healthCtx = document.getElementById('healthStatusChart');
    if (healthCtx) {
        DashboardState.charts.healthStatus = new Chart(healthCtx, {
            type: 'doughnut',
            data: {
                labels: ['Healthy', 'Treatment', 'Monitoring'],
                datasets: [{
                    data: [85, 10, 5],
                    backgroundColor: [
                        '#28a745',
                        '#ffc107',
                        '#17a2b8'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Feed Inventory Bar Chart
    const feedCtx = document.getElementById('feedInventoryChart');
    if (feedCtx) {
        DashboardState.charts.feedInventory = new Chart(feedCtx, {
            type: 'bar',
            data: {
                labels: ['Starter', 'Grower', 'Layer', 'Breeder'],
                datasets: [{
                    label: 'Bags in Stock',
                    data: [45, 38, 52, 28],
                    backgroundColor: [
                        '#4a7c59',
                        '#5d8c6b',
                        '#70a17d',
                        '#83b68f'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

// Search functionality
function initializeSearch() {
    const searchInput = document.getElementById('dashboardSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            performDashboardSearch(searchTerm);
        });
    }
}

function performDashboardSearch(term) {
    // Search through cards and sections
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(term)) {
            card.style.opacity = '1';
            card.style.transform = 'scale(1.05)';
        } else {
            card.style.opacity = term ? '0.5' : '1';
            card.style.transform = 'scale(1)';
        }
    });
}

// Auto-refresh data
function startAutoRefresh() {
    DashboardState.refreshInterval = setInterval(refreshDashboardData, 300000); // 5 minutes
}

async function refreshDashboardData() {
    try {
        const response = await fetch('api/get_dashboard_data.php');
        const result = await response.json();
        
        if (result.success) {
            updateDashboardStats(result.data);
        }
    } catch (error) {
        console.error('Error refreshing dashboard:', error);
    }
}

function updateDashboardStats(data) {
    // Update card values
    if (data.total_ducks !== undefined) {
        document.getElementById('totalDucks').textContent = formatNumber(data.total_ducks);
    }
    if (data.today_eggs !== undefined) {
        document.getElementById('todayEggs').textContent = formatNumber(data.today_eggs);
    }
    if (data.feed_bags !== undefined) {
        document.getElementById('feedBags').textContent = formatNumber(data.feed_bags);
    }
    if (data.sick_ducks !== undefined) {
        document.getElementById('sickDucks').textContent = formatNumber(data.sick_ducks);
    }
}

// Card interactions
document.querySelectorAll('.card[data-type]').forEach(card => {
    card.addEventListener('click', function() {
        const type = this.dataset.type;
        navigateToSection(type);
    });
});

function navigateToSection(type) {
    const routes = {
        'ducks': 'batches.php',
        'eggs': 'eggs.php',
        'feed': 'feed.php',
        'health': 'health.php'
    };
    
    if (routes[type]) {
        window.location.href = routes[type];
    }
}

// Utility functions
function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
}

function showLoadingIndicator() {
    const indicator = document.getElementById('loadingIndicator');
    if (indicator) {
        indicator.style.display = 'flex';
    }
}

function hideLoadingIndicator() {
    const indicator = document.getElementById('loadingIndicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type} show`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Export dashboard report
async function exportDashboardReport() {
    showLoadingIndicator();
    try {
        window.location.href = 'api/export_dashboard.php';
    } catch (error) {
        showNotification('Error exporting report', 'error');
    } finally {
        hideLoadingIndicator();
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (DashboardState.refreshInterval) {
        clearInterval(DashboardState.refreshInterval);
    }
});