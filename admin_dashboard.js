/**
 * Professional Admin Dashboard JavaScript
 * File: assets/js/admin_dashboard.js
 */

// Global variables
let revenueChart = null;
let productChart = null;
let currentFilters = {
    search: '',
    municipality: '',
    sort: 'revenue_desc',
    farmerFilter: 'all',
    activityType: 'all',
    date: ''
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    setupEventListeners();
});

// Main initialization function
async function initializeDashboard() {
    try {
        await loadDashboardStats();
        await loadTopFarmers();
        await loadRecentActivities();
        await loadChartData();
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showNotification('Error loading dashboard data', 'error');
    }
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const response = await fetch(window.config.apiBase + 'get_dashboard_stats.php');
        const result = await response.json();

        if (result.success) {
            renderStatsCards(result.data);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        showNotification('Failed to load statistics', 'error');
    }
}

// Render statistics cards
function renderStatsCards(data) {
    const statsGrid = document.getElementById('statsGrid');
    
    statsGrid.innerHTML = `
        <div class="stat-card green">
            <div class="stat-icon">
                <i class="fas fa-users"></i>
            </div>
            <div class="stat-info">
                <h3>${formatNumber(data.users.total_users)}</h3>
                <p>Total Farmers</p>
                <span class="stat-detail">
                    ${data.users.active_users} active, ${data.users.inactive_users} inactive
                </span>
            </div>
        </div>
        
        <div class="stat-card blue">
            <div class="stat-icon">
                <i class="fas fa-layer-group"></i>
            </div>
            <div class="stat-info">
                <h3>${formatNumber(data.ducks.total_batches)}</h3>
                <p>Total Batches</p>
                <span class="stat-detail">
                    ${formatNumber(data.ducks.total_ducks)} total ducks
                </span>
            </div>
        </div>
        
        <div class="stat-card orange">
            <div class="stat-icon">
                <i class="fas fa-egg"></i>
            </div>
            <div class="stat-info">
                <h3>${formatNumber(data.eggs.total_good_eggs)}</h3>
                <p>Good Eggs (30 days)</p>
                <span class="stat-detail">
                    ${parseFloat(data.eggs.avg_quality_rate).toFixed(1)}% quality rate
                </span>
            </div>
        </div>
        
        <div class="stat-card purple">
            <div class="stat-icon">
                <i class="fas fa-coins"></i>
            </div>
            <div class="stat-info">
                <h3>₱${formatMoney(data.sales.total_revenue)}</h3>
                <p>Total Revenue</p>
                <span class="stat-detail">
                    ${formatNumber(data.sales.total_sales)} transactions
                </span>
            </div>
        </div>
    `;

    // Animate cards
    document.querySelectorAll('.stat-card').forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'all 0.4s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 50);
        }, index * 100);
    });
}

// Load top farmers
async function loadTopFarmers() {
    try {
        const params = new URLSearchParams({
            limit: 10,
            search: currentFilters.search,
            municipality: currentFilters.municipality,
            sort: currentFilters.sort
        });

        const response = await fetch(window.config.apiBase + 'get_top_farmers.php?' + params);
        const result = await response.json();

        if (result.success) {
            renderFarmersTable(result.data);
            populateMunicipalityFilter(result.municipalities);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error loading farmers:', error);
        showNotification('Failed to load farmers data', 'error');
    }
}

// Render farmers table
function renderFarmersTable(farmers) {
    const tbody = document.getElementById('farmersTableBody');
    
    if (farmers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">No farmers found</td></tr>';
        return;
    }

    tbody.innerHTML = farmers.map((farmer, index) => `
        <tr>
            <td><span class="rank-badge rank-${index + 1}">${index + 1}</span></td>
            <td><strong>${escapeHtml(farmer.fullname)}</strong></td>
            <td>
                <span class="location-tag">
                    <i class="fas fa-map-marker-alt"></i>
                    ${escapeHtml(farmer.municipality || 'N/A')}
                </span>
            </td>
            <td>${formatNumber(farmer.total_batches)}</td>
            <td>${formatNumber(farmer.total_ducks)}</td>
            <td>${formatNumber(farmer.total_sales)}</td>
            <td class="revenue-cell">₱${formatMoney(farmer.total_revenue)}</td>
            <td>
                <span class="status-badge status-${farmer.status.toLowerCase()}">
                    ${capitalizeFirst(farmer.status)}
                </span>
            </td>
            <td>
                <button class="btn-view-details" onclick="viewFarmerDetails(${farmer.id})">
                    <i class="fas fa-eye"></i> View
                </button>
            </td>
        </tr>
    `).join('');
}

// Populate municipality filter
function populateMunicipalityFilter(municipalities) {
    const select = document.getElementById('municipalityFilter');
    const currentValue = select.value;
    
    select.innerHTML = '<option value="">All Municipalities</option>' +
        municipalities.map(muni => `<option value="${escapeHtml(muni)}">${escapeHtml(muni)}</option>`).join('');
    
    select.value = currentValue;
}

// Load recent activities
async function loadRecentActivities() {
    try {
        const params = new URLSearchParams({
            limit: 30,
            farmer_id: currentFilters.farmerFilter,
            type: currentFilters.activityType,
            date: currentFilters.date
        });

        const response = await fetch(window.config.apiBase + 'get_activities.php?' + params);
        const result = await response.json();

        if (result.success) {
            renderActivities(result.data);
            populateFarmerFilter(result.farmers);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error loading activities:', error);
        showNotification('Failed to load activities', 'error');
    }
}

// Render activities
function renderActivities(activities) {
    const activityList = document.getElementById('activityList');
    
    if (activities.length === 0) {
        activityList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>No Activities Found</h3>
                <p>No activities match your current filters.</p>
            </div>
        `;
        return;
    }

    activityList.innerHTML = activities.map(activity => {
        const iconClass = getActivityIcon(activity.activity_type);
        return `
            <div class="activity-item">
                <div class="activity-icon ${activity.activity_type}">
                    <i class="fas fa-${iconClass}"></i>
                </div>
                <div class="activity-content">
                    <p class="activity-user">
                        ${escapeHtml(activity.fullname)}
                        ${activity.municipality ? `<span class="location-badge">${escapeHtml(activity.municipality)}</span>` : ''}
                    </p>
                    <p class="activity-desc">${escapeHtml(activity.description)}</p>
                    <span class="activity-time">
                        <i class="fas fa-clock"></i>
                        ${activity.time_ago}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

// Get activity icon
function getActivityIcon(type) {
    const icons = {
        'batch': 'layer-group',
        'sale': 'coins',
        'duck_loss': 'exclamation-triangle',
        'feed': 'wheat-awn',
        'egg': 'egg'
    };
    return icons[type] || 'circle';
}

// Populate farmer filter
function populateFarmerFilter(farmers) {
    const select = document.getElementById('farmerFilter');
    const currentValue = select.value;
    
    select.innerHTML = '<option value="all">All Farmers</option>' +
        farmers.map(farmer => `<option value="${farmer.id}">${escapeHtml(farmer.fullname)}</option>`).join('');
    
    select.value = currentValue;
}

// Load chart data
async function loadChartData() {
    try {
        const months = document.getElementById('revenueMonthFilter')?.value || 6;
        const response = await fetch(window.config.apiBase + 'get_chart_data.php?months=' + months);
        const result = await response.json();

        if (result.success) {
            renderRevenueChart(result.data.revenue_trend);
            renderProductChart(result.data.product_distribution);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error loading chart data:', error);
    }
}

// Render revenue chart
function renderRevenueChart(data) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    if (revenueChart) {
        revenueChart.destroy();
    }

    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.month_label),
            datasets: [{
                label: 'Revenue (₱)',
                data: data.map(d => parseFloat(d.revenue)),
                borderColor: '#2d9d61',
                backgroundColor: 'rgba(45, 157, 97, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Revenue: ₱' + formatMoney(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₱' + formatMoney(value);
                        }
                    }
                }
            }
        }
    });
}

// Render product chart
function renderProductChart(data) {
    const ctx = document.getElementById('productChart');
    if (!ctx) return;

    if (productChart) {
        productChart.destroy();
    }

    productChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(d => d.product_type),
            datasets: [{
                data: data.map(d => parseFloat(d.revenue)),
                backgroundColor: [
                    '#2d9d61',
                    '#3b82f6',
                    '#f59e0b',
                    '#8b5cf6',
                    '#ef4444'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'right'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ₱' + formatMoney(context.parsed);
                        }
                    }
                }
            }
        }
    });
}

// View farmer details
async function viewFarmerDetails(farmerId) {
    const modal = document.getElementById('farmerDetailsModal');
    const content = document.getElementById('farmerDetailsContent');
    
    modal.classList.add('active');
    content.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Loading...</p></div>';
    
    try {
        const response = await fetch(window.config.apiBase + 'get_farmer_details.php?farmer_id=' + farmerId);
        const result = await response.json();

        if (result.success) {
            renderFarmerDetails(result.data);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error loading farmer details:', error);
        content.innerHTML = '<div class="error-state"><p>Failed to load farmer details</p></div>';
    }
}

// Render farmer details
function renderFarmerDetails(data) {
    const content = document.getElementById('farmerDetailsContent');
    const farmer = data.farmer;
    
    content.innerHTML = `
        <div class="farmer-details-container">
            <div class="farmer-header">
                <div class="farmer-avatar">
                    <img src="${farmer.profile_pic}" alt="${escapeHtml(farmer.fullname)}">
                </div>
                <div class="farmer-info">
                    <h2>${escapeHtml(farmer.fullname)}</h2>
                    <p class="farmer-email"><i class="fas fa-envelope"></i> ${escapeHtml(farmer.useremail)}</p>
                    <p class="farmer-location">
                        <i class="fas fa-map-marker-alt"></i> 
                        ${escapeHtml(farmer.district || 'N/A')}, ${escapeHtml(farmer.municipality || 'N/A')}
                    </p>
                    <div class="farmer-status">
                        <span class="status-badge status-${farmer.status}">${capitalizeFirst(farmer.status)}</span>
                        <span class="joined-date">
                            <i class="fas fa-calendar"></i> Joined ${formatDate(farmer.created_at)}
                        </span>
                    </div>
                </div>
            </div>

            <div class="stats-grid-small">
                <div class="stat-card-small blue">
                    <i class="fas fa-layer-group"></i>
                    <div>
                        <h3>${formatNumber(data.stats.total_batches)}</h3>
                        <p>Total Batches</p>
                    </div>
                </div>
                <div class="stat-card-small green">
                    <i class="fas fa-dollar-sign"></i>
                    <div>
                        <h3>₱${formatMoney(data.stats.total_revenue)}</h3>
                        <p>Total Revenue</p>
                    </div>
                </div>
                <div class="stat-card-small orange">
                    <i class="fas fa-shopping-cart"></i>
                    <div>
                        <h3>${formatNumber(data.stats.total_sales)}</h3>
                        <p>Total Sales</p>
                    </div>
                </div>
                <div class="stat-card-small purple">
                    <i class="fas fa-crow"></i>
                    <div>
                        <h3>${formatNumber(data.stats.total_ducks)}</h3>
                        <p>Total Ducks</p>
                    </div>
                </div>
            </div>

            <div class="detail-tabs">
                <button class="detail-tab active" data-tab="batches">
                    <i class="fas fa-layer-group"></i> Batches
                </button>
                <button class="detail-tab" data-tab="sales">
                    <i class="fas fa-coins"></i> Recent Sales
                </button>
                <button class="detail-tab" data-tab="activities">
                    <i class="fas fa-history"></i> Activities
                </button>
            </div>

            <div class="detail-content">
                <div class="detail-panel active" id="panel-batches">
                    ${renderBatchesTable(data.batches)}
                </div>
                <div class="detail-panel" id="panel-sales">
                    ${renderSalesTable(data.sales)}
                </div>
                <div class="detail-panel" id="panel-activities">
                    ${renderActivitiesTimeline(data.activities)}
                </div>
            </div>
        </div>
    `;

    // Setup tab switching
    document.querySelectorAll('.detail-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.detail-panel').forEach(p => p.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById('panel-' + this.dataset.tab).classList.add('active');
        });
    });
}

// Render batches table
function renderBatchesTable(batches) {
    if (batches.length === 0) {
        return '<div class="empty-state-small"><i class="fas fa-inbox"></i><p>No batches found</p></div>';
    }

    return `
        <table class="detail-table">
            <thead>
                <tr>
                    <th>Batch Code</th>
                    <th>Name</th>
                    <th>Breed</th>
                    <th>Current/Initial</th>
                    <th>Status</th>
                    <th>Start Date</th>
                </tr>
            </thead>
            <tbody>
                ${batches.map(batch => `
                    <tr>
                        <td><strong>${escapeHtml(batch.batch_code)}</strong></td>
                        <td>${escapeHtml(batch.batch_name)}</td>
                        <td>${escapeHtml(batch.breed)}</td>
                        <td>${formatNumber(batch.current_count)}/${formatNumber(batch.initial_count)}</td>
                        <td><span class="status-badge">${batch.status}</span></td>
                        <td>${formatDate(batch.start_date)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Render sales table
function renderSalesTable(sales) {
    if (sales.length === 0) {
        return '<div class="empty-state-small"><i class="fas fa-inbox"></i><p>No sales found</p></div>';
    }

    return `
        <table class="detail-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                    <th>Customer</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${sales.map(sale => `
                    <tr>
                        <td>${formatDate(sale.sale_date)}</td>
                        <td>${escapeHtml(sale.product_type)}</td>
                        <td>${formatNumber(sale.quantity)}</td>
                        <td>₱${formatMoney(sale.unit_price)}</td>
                        <td class="revenue-cell">₱${formatMoney(sale.total_amount)}</td>
                        <td>${escapeHtml(sale.customer_name || 'N/A')}</td>
                        <td><span class="status-badge status-${sale.payment_status.toLowerCase()}">${sale.payment_status}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Render activities timeline
function renderActivitiesTimeline(activities) {
    if (activities.length === 0) {
        return '<div class="empty-state-small"><i class="fas fa-inbox"></i><p>No activities found</p></div>';
    }

    return `
        <div class="activity-timeline-small">
            ${activities.map(activity => `
                <div class="activity-item-small">
                    <div class="activity-icon-small"></div>
                    <div class="activity-content-small">
                        <p>${escapeHtml(activity.activity_description)}</p>
                        <span class="activity-time-small">${formatDateTime(activity.created_at)}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Setup event listeners
function setupEventListeners() {
    // Refresh button
    document.getElementById('refreshBtn')?.addEventListener('click', () => {
        initializeDashboard();
        showNotification('Dashboard refreshed', 'success');
    });

    // Search farmer
    document.getElementById('searchFarmer')?.addEventListener('input', debounce(function(e) {
        currentFilters.search = e.target.value;
        loadTopFarmers();
    }, 500));

    // Municipality filter
    document.getElementById('municipalityFilter')?.addEventListener('change', function(e) {
        currentFilters.municipality = e.target.value;
        loadTopFarmers();
    });

    // Sort revenue
    document.getElementById('sortRevenue')?.addEventListener('change', function(e) {
        currentFilters.sort = e.target.value;
        loadTopFarmers();
    });

    // Farmer filter
    document.getElementById('farmerFilter')?.addEventListener('change', function(e) {
        currentFilters.farmerFilter = e.target.value;
        loadRecentActivities();
    });

    // Activity type filter
    document.getElementById('activityTypeFilter')?.addEventListener('change', function(e) {
        currentFilters.activityType = e.target.value;
        loadRecentActivities();
    });

    // Date filter
    document.getElementById('dateFilter')?.addEventListener('change', function(e) {
        currentFilters.date = e.target.value;
        loadRecentActivities();
    });

    // Revenue month filter
    document.getElementById('revenueMonthFilter')?.addEventListener('change', function() {
        loadChartData();
    });
}

// Close modal
function closeModal() {
    document.getElementById('farmerDetailsModal').classList.remove('active');
}

// Utility functions
function formatNumber(num) {
    return new Intl.NumberFormat('en-US').format(num || 0);
}

function formatMoney(amount) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount || 0);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}