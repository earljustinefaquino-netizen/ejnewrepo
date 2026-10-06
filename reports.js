/**
 * AGRI-DUCK Reports JavaScript
 * Enhanced Reports & Analytics Functionality
 * File: assets/js/report/reports.js
 */

// Global chart instance
let productionChart = null;

// Document Ready - Initialize all features
document.addEventListener('DOMContentLoaded', function() {
    initializeChart();
    initializeFilters();
    initializeKPIAnimations();
    initializeDateRangePresets();
    initializeTooltips();
    // Buttons are now in HTML, no need to add via JS
    
    // Add chart type switcher after a brief delay to ensure DOM is ready
    setTimeout(addChartTypeSwitcher, 100);
});

/**
 * Initialize Production Chart
 * Creates an interactive line chart for egg production data
 */
function initializeChart() {
    const productionData = window.productionData || [];
    
    if (productionData.length === 0) {
        console.warn('No production data available for chart');
        return;
    }

    // Format labels for chart
    const labels = productionData.map(d => {
        const date = new Date(d.collection_date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    // Extract egg data
    const data = productionData.map(d => parseInt(d.eggs) || 0);

    const ctx = document.getElementById('productionChart');
    if (!ctx) {
        console.error('Chart canvas not found');
        return;
    }

    // Destroy existing chart if present
    if (productionChart) {
        productionChart.destroy();
    }

    // Create new chart instance
    productionChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Eggs Collected',
                data: data,
                borderColor: '#4a7c59',
                backgroundColor: 'rgba(74, 124, 89, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#4a7c59',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
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
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 14 },
                    bodyFont: { size: 13 },
                    callbacks: {
                        label: function(context) {
                            return 'Eggs: ' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

/**
 * Initialize Date Range Presets
 * Adds quick buttons for common date ranges
 */
function initializeDateRangePresets() {
    const presetsContainer = document.querySelector('.filters-section form');
    if (!presetsContainer) return;

    // Create preset buttons container
    const presetButtons = document.createElement('div');
    presetButtons.className = 'date-presets';
    presetButtons.innerHTML = `
        <button type="button" class="preset-btn" data-days="7">Last 7 Days</button>
        <button type="button" class="preset-btn" data-days="30">Last 30 Days</button>
        <button type="button" class="preset-btn" data-days="90">Last 90 Days</button>
        <button type="button" class="preset-btn" data-days="365">Last Year</button>
        <button type="button" class="preset-btn" data-custom="month">This Month</button>
        <button type="button" class="preset-btn" data-custom="year">This Year</button>
    `;

    presetsContainer.appendChild(presetButtons);

    // Add click handlers for each preset button
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const days = this.getAttribute('data-days');
            const custom = this.getAttribute('data-custom');
            const endDate = new Date();
            let startDate = new Date();

            // Calculate start date based on preset
            if (days) {
                startDate.setDate(endDate.getDate() - parseInt(days));
            } else if (custom === 'month') {
                startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
            } else if (custom === 'year') {
                startDate = new Date(endDate.getFullYear(), 0, 1);
            }

            // Update date inputs
            document.getElementById('start_date').value = formatDate(startDate);
            document.getElementById('end_date').value = formatDate(endDate);
            
            // Highlight active button
            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

/**
 * Format date as YYYY-MM-DD
 * @param {Date} date - Date object to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Initialize Form Filters
 * Adds validation and loading states to filter form
 */
function initializeFilters() {
    const form = document.querySelector('.filters-section form');
    if (!form) return;

    // Add loading state on form submission
    form.addEventListener('submit', function(e) {
        const btn = this.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Loading...';
    });

    // Date validation
    const startDate = document.getElementById('start_date');
    const endDate = document.getElementById('end_date');

    if (startDate && endDate) {
        // Validate end date
        endDate.addEventListener('change', function() {
            if (startDate.value && endDate.value) {
                if (new Date(startDate.value) > new Date(endDate.value)) {
                    alert('End date must be after start date');
                    endDate.value = startDate.value;
                }
            }
        });

        // Auto-adjust end date if start date changes
        startDate.addEventListener('change', function() {
            if (startDate.value && endDate.value) {
                if (new Date(startDate.value) > new Date(endDate.value)) {
                    endDate.value = startDate.value;
                }
            }
        });
    }
}

/**
 * Animate KPI Cards on Scroll
 * Adds fade-in animation when cards become visible
 */
function initializeKPIAnimations() {
    const kpiCards = document.querySelectorAll('.kpi-card, .summary-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
            }
        });
    }, { threshold: 0.1 });

    // Initialize cards with hidden state
    kpiCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(card);
    });
}

/**
 * Switch Chart Type
 * Changes chart visualization type (line, bar, etc.)
 * @param {string} type - Chart type (line, bar, area)
 */
function switchChartType(type) {
    if (!productionChart) return;
    
    productionChart.config.type = type;
    productionChart.update();
}

/**
 * Add Chart Type Switcher
 * Creates buttons to toggle between chart types
 */
function addChartTypeSwitcher() {
    const chartContainer = document.querySelector('.chart-container');
    if (!chartContainer) return;

    const switcher = document.createElement('div');
    switcher.className = 'chart-switcher';
    switcher.style.cssText = 'margin-bottom: 15px; text-align: center;';
    switcher.innerHTML = `
        <button class="chart-type-btn active" data-type="line" style="padding: 8px 16px; margin: 0 5px; background: #4a7c59; color: white; border: none; border-radius: 5px; cursor: pointer;">Line</button>
        <button class="chart-type-btn" data-type="bar" style="padding: 8px 16px; margin: 0 5px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">Bar</button>
    `;

    chartContainer.insertBefore(switcher, chartContainer.querySelector('canvas'));

    // Add click handlers for chart type buttons
    document.querySelectorAll('.chart-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.chart-type-btn').forEach(b => {
                b.classList.remove('active');
                b.style.background = '#6c757d';
            });
            this.classList.add('active');
            this.style.background = '#4a7c59';
            switchChartType(this.getAttribute('data-type'));
        });
    });
}

/**
 * Initialize Tooltips
 * Adds hover tooltips to elements with data-tooltip attribute
 */
function initializeTooltips() {
    document.querySelectorAll('[data-tooltip]').forEach(element => {
        element.addEventListener('mouseenter', function(e) {
            const tooltip = document.createElement('div');
            tooltip.className = 'custom-tooltip';
            tooltip.textContent = this.getAttribute('data-tooltip');
            tooltip.style.cssText = `
                position: absolute;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 8px 12px;
                border-radius: 5px;
                font-size: 12px;
                white-space: nowrap;
                z-index: 10000;
                pointer-events: none;
            `;
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
            tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
            
            this._tooltip = tooltip;
        });
        
        element.addEventListener('mouseleave', function() {
            if (this._tooltip) {
                this._tooltip.remove();
                this._tooltip = null;
            }
        });
    });
}

/**
 * Calculate Date Range Statistics
 * Returns statistics about the selected date range
 * @returns {Object} Statistics object
 */
function getDateRangeStats() {
    const startDate = document.getElementById('start_date');
    const endDate = document.getElementById('end_date');
    
    if (!startDate || !endDate) return null;
    
    const start = new Date(startDate.value);
    const end = new Date(endDate.value);
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    return {
        startDate: start,
        endDate: end,
        daysDifference: daysDiff,
        weeksDifference: Math.ceil(daysDiff / 7),
        monthsDifference: Math.ceil(daysDiff / 30)
    };
}

/**
 * Format Number with Locale
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
function formatNumber(num) {
    return new Intl.NumberFormat('en-PH').format(num);
}

/**
 * Format Currency (Philippine Peso)
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency
 */
function formatCurrency(amount) {
    return '₱' + new Intl.NumberFormat('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// Export functions for potential external use
window.reportsModule = {
    initializeChart,
    switchChartType,
    formatDate,
    formatNumber,
    formatCurrency,
    getDateRangeStats
};

// Export data
function exportEggData() {
    window.location.href = 'api/report/export_report.php';
}