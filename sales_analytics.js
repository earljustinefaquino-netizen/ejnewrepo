// assets/js/sale/sales_analytics.js

let currentRange = 'month';
let salesChart = null;
let productChart = null;
let paymentChart = null;

// Load analytics on page load
document.addEventListener('DOMContentLoaded', function() {
    loadAnalytics('month');
});

async function loadAnalytics(range) {
    currentRange = range;
    
    // Update active button
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event?.target?.classList.add('active');
    
    const content = document.getElementById('analyticsContent');
    content.innerHTML = '<div class="loading">Loading analytics...</div>';
    
    try {
        const response = await fetch(`api/sale/get_analytics.php?range=${range}`);
        const result = await response.json();
        
        if (result.success) {
            renderAnalytics(result.data);
        } else {
            content.innerHTML = `<div class="loading" style="color: #dc3545;">Error: ${result.message}</div>`;
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
        content.innerHTML = '<div class="loading" style="color: #dc3545;">Failed to load analytics</div>';
    }
}

function renderAnalytics(data) {
    const content = document.getElementById('analyticsContent');
    
    const html = `
        <!-- Key Metrics -->
        <div class="metrics-grid">
            ${createMetricCard('Total Sales', formatCurrency(data.totalSales), '💰', '#28a745', data.growthRate)}
            ${createMetricCard('Total Transactions', data.totalTransactions.toLocaleString(), '📦', '#4D96FF', null)}
            ${createMetricCard('Average Order Value', formatCurrency(data.averageOrderValue), '📈', '#FFD93D', null)}
            ${createMetricCard('Growth Rate', data.growthRate + '%', '📅', '#FF6B9D', null)}
        </div>
        
        <!-- Charts -->
        <div class="charts-grid">
            <div class="chart-card">
                <h3>Sales Trend</h3>
                <div class="chart-container">
                    <canvas id="salesChart"></canvas>
                </div>
            </div>
            
            <div class="chart-card">
                <h3>Product Sales Distribution</h3>
                <div class="chart-container">
                    <canvas id="productChart"></canvas>
                </div>
            </div>
        </div>
        
        <!-- Bottom Section -->
        <div class="bottom-grid">
            <div class="chart-card">
                <h3>Top Customers</h3>
                <div class="customer-list">
                    ${data.topCustomers.length > 0 
                        ? data.topCustomers.map((customer, index) => createCustomerItem(customer, index)).join('')
                        : '<p style="text-align: center; color: #666; padding: 2rem;">No customer data available</p>'
                    }
                </div>
            </div>
            
            <div class="chart-card">
                <h3>Payment Methods</h3>
                <div class="chart-container">
                    <canvas id="paymentChart"></canvas>
                </div>
            </div>
        </div>
        
        <button class="export-btn" onclick="exportReport()">📥 Export Full Report (CSV)</button>
    `;
    
    content.innerHTML = html;
    
    // Render charts
    setTimeout(() => {
        renderSalesChart(data.dailySales);
        renderProductChart(data.productSales);
        renderPaymentChart(data.paymentMethods);
    }, 100);
}

function createMetricCard(title, value, icon, color, growth) {
    const trendHtml = growth !== null && growth !== undefined ? `
        <div class="metric-trend ${growth >= 0 ? 'trend-up' : 'trend-down'}">
            <span>${growth >= 0 ? '↗' : '↘'}</span>
            <span style="font-weight: 600;">${Math.abs(growth)}%</span>
            <span style="color: #666;">vs last period</span>
        </div>
    ` : '';
    
    return `
        <div class="metric-card">
            <div class="metric-card-header">
                <div>
                    <div class="metric-title">${title}</div>
                    <div class="metric-value">${value}</div>
                </div>
                <div class="metric-icon" style="background: ${color};">
                    ${icon}
                </div>
            </div>
            ${trendHtml}
        </div>
    `;
}

function createCustomerItem(customer, index) {
    return `
        <div class="customer-item">
            <div>
                <div>
                    <span class="customer-rank">${index + 1}.</span>
                    <strong>${customer.name}</strong>
                </div>
                <div style="font-size: 0.875rem; color: #666; margin-top: 0.25rem;">
                    ${customer.orders} orders
                </div>
            </div>
            <div class="customer-sales">
                ${formatCurrency(customer.sales)}
            </div>
        </div>
    `;
}

function renderSalesChart(data) {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (salesChart) {
        salesChart.destroy();
    }
    
    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.date),
            datasets: [
                {
                    label: 'Sales (₱)',
                    data: data.map(d => d.sales),
                    borderColor: '#4D96FF',
                    backgroundColor: 'rgba(77, 150, 255, 0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y'
                },
                {
                    label: 'Transactions',
                    data: data.map(d => d.transactions),
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                if (context.datasetIndex === 0) {
                                    label += formatCurrency(context.parsed.y);
                                } else {
                                    label += context.parsed.y;
                                }
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    ticks: {
                        callback: function(value) {
                            return '₱' + value.toLocaleString();
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

function renderProductChart(data) {
    const ctx = document.getElementById('productChart');
    if (!ctx) return;
    
    if (productChart) {
        productChart.destroy();
    }
    
    productChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(d => d.name),
            datasets: [{
                data: data.map(d => d.value),
                backgroundColor: data.map(d => d.color),
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
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = formatCurrency(context.parsed);
                            const percentage = data[context.dataIndex].percentage;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function renderPaymentChart(data) {
    const ctx = document.getElementById('paymentChart');
    if (!ctx) return;
    
    if (paymentChart) {
        paymentChart.destroy();
    }
    
    paymentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.method),
            datasets: [{
                label: 'Amount',
                data: data.map(d => d.amount),
                backgroundColor: '#6BCB77',
                borderRadius: 8
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatCurrency(context.parsed.x);
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        callback: function(value) {
                            return '₱' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function formatCurrency(value) {
    return '₱' + parseFloat(value).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

async function exportReport() {
    try {
        window.location.href = `api/sale/export_analytics.php?range=${currentRange}`;
    } catch (error) {
        console.error('Export error:', error);
        alert('Failed to export report');
    }
}