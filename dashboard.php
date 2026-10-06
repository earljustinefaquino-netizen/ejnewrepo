<?php
session_start();
require_once 'includes/dbconnection.php';
require_once 'includes/user_profile.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit;
}

$user_id = $_SESSION['user_id'];
$fullname = $_SESSION['fullname'];
$profile_pic = isset($_SESSION['profile_pic']) ? $_SESSION['profile_pic'] : 'assets/images/default_user.png';

// ============================================
// DASHBOARD STATISTICS
// ============================================

$stats = [
    'total_ducks' => 0,
    'today_eggs' => 0,
    'feed_bags' => 0,
    'active_batches' => 0,
    'total_sales_today' => 0,
    'laying_ducks' => 0,
    'mortality_rate' => 0,
    'avg_production_rate' => 0
];

// Total ducks and laying ducks
$query = "SELECT 
    SUM(current_count) as total,
    SUM(CASE WHEN status IN ('Laying', 'Peak Production') THEN current_count ELSE 0 END) as laying
    FROM duck_batches WHERE farmer_id = ? AND status != 'Retired'";
$stmt = $conn->prepare($query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();
$stats['total_ducks'] = $row['total'] ?? 0;
$stats['laying_ducks'] = $row['laying'] ?? 0;

// Today's egg collection
$query = "SELECT SUM(total_eggs) as total FROM egg_collection WHERE farmer_id = ? AND collection_date = CURDATE()";
$stmt = $conn->prepare($query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();
$stats['today_eggs'] = $row['total'] ?? 0;

// Calculate average production rate (eggs per laying duck)
if ($stats['laying_ducks'] > 0 && $stats['today_eggs'] > 0) {
    $stats['avg_production_rate'] = round(($stats['today_eggs'] / $stats['laying_ducks']) * 100, 1);
}

// Total feed bags
$query = "SELECT SUM(quantity_bags) as total FROM feed_inventory WHERE farmer_id = ? AND quantity_bags > 0";
$stmt = $conn->prepare($query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();
$stats['feed_bags'] = $row['total'] ?? 0;

// Active batches
$query = "SELECT COUNT(*) as total FROM duck_batches WHERE farmer_id = ? AND status NOT IN ('Retired')";
$stmt = $conn->prepare($query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();
$stats['active_batches'] = $row['total'] ?? 0;

// Today's sales
$query = "SELECT SUM(total_amount) as total FROM sales WHERE farmer_id = ? AND sale_date = CURDATE()";
$stmt = $conn->prepare($query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();
$stats['total_sales_today'] = $row['total'] ?? 0;

// Overall mortality rate
$query = "SELECT 
    SUM(initial_count) as initial,
    SUM(mortality_count) as deaths
    FROM duck_batches WHERE farmer_id = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();
$initial = $row['initial'] ?? 1;
$deaths = $row['deaths'] ?? 0;
$stats['mortality_rate'] = $initial > 0 ? round(($deaths / $initial) * 100, 2) : 0;

// ============================================
// CHART DATA - Last 30 Days Egg Production
// ============================================
$egg_chart_data = [];
$egg_chart_labels = [];
for ($i = 29; $i >= 0; $i--) {
    $date = date('Y-m-d', strtotime("-$i days"));
    $query = "SELECT SUM(total_eggs) as total FROM egg_collection WHERE farmer_id = ? AND collection_date = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("is", $user_id, $date);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $egg_chart_data[] = $row['total'] ?? 0;
    $egg_chart_labels[] = date('M d', strtotime($date));
}

// ============================================
// BATCH PERFORMANCE BREAKDOWN
// ============================================
$batch_performance = [];
$query = "SELECT 
    batch_name,
    current_count,
    status,
    DATEDIFF(CURDATE(), start_date) as age_days,
    mortality_count,
    initial_count
    FROM duck_batches 
    WHERE farmer_id = ? AND status != 'Retired'
    ORDER BY current_count DESC
    LIMIT 5";
$stmt = $conn->prepare($query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
while ($row = $result->fetch_assoc()) {
    $batch_performance[] = $row;
}

// ============================================
// PRODUCTION QUALITY METRICS - Last 30 Days
// ============================================
$quality_query = "SELECT 
    SUM(total_eggs) as total,
    SUM(good_eggs) as good,
    SUM(cracked_eggs) as cracked,
    SUM(dirty_eggs) as dirty,
    SUM(small_eggs) as small
    FROM egg_collection 
    WHERE farmer_id = ? AND collection_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
$stmt = $conn->prepare($quality_query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$quality_metrics = $result->fetch_assoc();

$quality_rate = 0;
if (($quality_metrics['total'] ?? 0) > 0) {
    $quality_rate = round((($quality_metrics['good'] ?? 0) / $quality_metrics['total']) * 100, 1);
}

// ============================================
// FINANCIAL SUMMARY - Current Month
// ============================================
$financial_query = "SELECT 
    SUM(total_amount) as revenue
    FROM sales 
    WHERE farmer_id = ? 
    AND MONTH(sale_date) = MONTH(CURDATE()) 
    AND YEAR(sale_date) = YEAR(CURDATE())";
$stmt = $conn->prepare($financial_query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$financial = $result->fetch_assoc();
$monthly_revenue = $financial['revenue'] ?? 0;

// Monthly expenses (feed purchases)
$expense_query = "SELECT SUM(total_cost) as expenses FROM feed_inventory 
                  WHERE farmer_id = ? 
                  AND MONTH(purchase_date) = MONTH(CURDATE()) 
                  AND YEAR(purchase_date) = YEAR(CURDATE())";
$stmt = $conn->prepare($expense_query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$expense = $result->fetch_assoc();
$monthly_expenses = $expense['expenses'] ?? 0;
$monthly_profit = $monthly_revenue - $monthly_expenses;

// ============================================
// RECENT ACTIVITIES
// ============================================
date_default_timezone_set('Asia/Manila');

$recent_activities = [];
$query = "SELECT activity_description, created_at FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 8";
$stmt = $conn->prepare($query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
while ($row = $result->fetch_assoc()) {
    $recent_activities[] = $row;
}

// ============================================
// ALERTS & NOTIFICATIONS
// ============================================
$alerts = [];

// Low feed stock alert
$low_feed_query = "SELECT COUNT(*) as count FROM feed_inventory WHERE farmer_id = ? AND quantity_bags > 0 AND quantity_bags <= 5";
$stmt = $conn->prepare($low_feed_query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$low_feed = $result->fetch_assoc();
if (($low_feed['count'] ?? 0) > 0) {
    $alerts[] = ['type' => 'warning', 'message' => 'You have ' . $low_feed['count'] . ' feed type(s) running low on stock'];
}

// Low production alert
if ($stats['avg_production_rate'] < 50 && $stats['laying_ducks'] > 0) {
    $alerts[] = ['type' => 'warning', 'message' => 'Production rate is below 50% - consider checking duck health and feed quality'];
}

// High mortality alert
if ($stats['mortality_rate'] > 5) {
    $alerts[] = ['type' => 'danger', 'message' => 'Mortality rate is above 5% - immediate attention required'];
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - AGRI-DUCK Management</title>
    
    <!-- Modular CSS Files -->
<link rel="stylesheet" href="assets/css/sidebar.css">
<link rel="stylesheet" href="assets/css/header.css">
<link rel="stylesheet" href="assets/css/dashboard.css">
    
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Chart.js -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
</head>
<body>
    <!-- SIDEBAR -->
    <div class="sidebar">
        <div class="profile-block">
            <img src="<?php echo htmlspecialchars($profile_pic); ?>" alt="User Photo" class="profile-pic">
            <h3><?php echo htmlspecialchars($fullname); ?></h3>
            <p>Farm Manager</p>
        </div>

        <ul class="nav-links">
            <li><a href="dashboard.php" class="active">📊 Dashboard</a></li>
            <li><a href="batches.php">🦆 Duck Batches</a></li>
            <li><a href="feed.php">🌽 Feed Inventory</a></li>
            <li><a href="eggs.php">🥚 Egg Collection</a></li>
            <li><a href="sales.php">💵 Sales</a></li>
            <li><a href="reports.php">📊 Reports</a></li>
            <li><a href="profile.php">👤 Profile/Settings</a></li>
        </ul>
    </div>

    <!-- MAIN CONTENT -->
    <div class="main-content">
        <!-- Topbar -->
        <div class="topbar">
            <div class="left-header">
                <img src="assets/images/logo1.png" alt="AgriDuck Logo" class="top-logo">
                <h1>AGRI-<span>DUCK</span></h1>
            </div>
            <div class="right-header">
                <form class="search-form">
                    <input type="text" placeholder="Search..." id="dashboardSearch">
                </form>
                <span id="currentDateTime"></span>
                <a href="includes/logout.php" class="logout-btn">Logout</a>
            </div>
        </div>

        <!-- Alerts Section -->
        <?php if (!empty($alerts)): ?>
        <div class="alerts-section">
            <?php foreach ($alerts as $alert): ?>
            <div class="alert alert-<?php echo $alert['type']; ?>">
                <span class="alert-icon">⚠️</span>
                <span><?php echo $alert['message']; ?></span>
                <button class="alert-close" onclick="this.parentElement.remove()">×</button>
            </div>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>

        <!-- Dashboard Header -->
        <div style="margin-bottom: 2rem;">
            <h2 style="color: var(--primary-green); font-size: 2rem; margin-bottom: 0.5rem;">Farm Overview</h2>
            <p style="color: var(--gray);">Welcome back, <?php echo htmlspecialchars($fullname); ?>! Here's what's happening with your farm today.</p>
        </div>

        <!-- Dashboard Cards -->
        <div class="dashboard-cards">
            <div class="card">
                <div class="card-header">
                    <div class="card-icon">🦆</div>
                    <span class="card-trend <?php echo $stats['total_ducks'] > 0 ? 'up' : ''; ?>">
                        <?php echo $stats['laying_ducks']; ?> laying
                    </span>
                </div>
                <div class="card-content">
                    <h3><?php echo number_format($stats['total_ducks']); ?></h3>
                    <p>Total Ducks</p>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-icon">🥚</div>
                    <span class="card-trend <?php echo $stats['avg_production_rate'] >= 60 ? 'up' : 'down'; ?>">
                        <?php echo $stats['avg_production_rate']; ?>% rate
                    </span>
                </div>
                <div class="card-content">
                    <h3><?php echo number_format($stats['today_eggs']); ?></h3>
                    <p>Today's Eggs</p>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-icon">🌽</div>
                    <span class="card-trend <?php echo $stats['feed_bags'] > 20 ? 'up' : 'down'; ?>">
                        <?php echo $stats['feed_bags'] > 20 ? 'Good' : 'Low'; ?>
                    </span>
                </div>
                <div class="card-content">
                    <h3><?php echo number_format($stats['feed_bags']); ?></h3>
                    <p>Feed Bags Left</p>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-icon">📦</div>
                </div>
                <div class="card-content">
                    <h3><?php echo number_format($stats['active_batches']); ?></h3>
                    <p>Active Batches</p>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-icon">💰</div>
                    <span class="card-trend up">Today</span>
                </div>
                <div class="card-content">
                    <h3>₱<?php echo number_format($stats['total_sales_today'], 2); ?></h3>
                    <p>Sales</p>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-icon">⚠️</div>
                    <span class="card-trend <?php echo $stats['mortality_rate'] < 3 ? 'up' : 'down'; ?>">
                        <?php echo $stats['mortality_rate'] < 3 ? 'Good' : 'High'; ?>
                    </span>
                </div>
                <div class="card-content">
                    <h3><?php echo $stats['mortality_rate']; ?>%</h3>
                    <p>Mortality Rate</p>
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
            <a href="batches.php?action=add" class="quick-action">➕ Add New Batch</a>
            <a href="eggs.php?action=record" class="quick-action">🥚 Record Eggs</a>
            <a href="feed.php?action=add" class="quick-action">🌽 Add Feed</a>
            <a href="sales.php?action=record" class="quick-action">💰 Record Sale</a>
        </div>

        <!-- Charts Section -->
        <h3 style="margin: 2rem 0 1rem 0; color: var(--primary-green); font-size: 1.5rem;">📈 Farm Analytics</h3>
        
        <div class="charts-section">
            <!-- Egg Production Trend -->
            <div class="chart-container" style="grid-column: span 2;">
                <h3>Egg Production Trend (Last 30 Days)</h3>
                <div class="chart-wrapper">
                    <canvas id="eggProductionChart"></canvas>
                </div>
            </div>

            <!-- Production Quality Breakdown -->
            <div class="chart-container">
                <h3>Egg Quality Distribution</h3>
                <div class="chart-wrapper">
                    <canvas id="qualityChart"></canvas>
                </div>
                <div style="padding: 1rem; text-align: center;">
                    <div style="font-size: 2rem; font-weight: 700; color: var(--primary-green);">
                        <?php echo $quality_rate; ?>%
                    </div>
                    <div style="color: var(--gray);">Overall Quality Rate</div>
                </div>
            </div>

            <!-- Financial Summary -->
            <div class="chart-container">
                <h3>Monthly Financial Summary</h3>
                <div style="padding: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 1.5rem; padding: 1rem; background: rgba(74, 124, 89, 0.1); border-radius: 8px;">
                        <span style="font-weight: 600; color: var(--primary-green);">Revenue:</span>
                        <span style="font-weight: 700; color: var(--primary-green);">₱<?php echo number_format($monthly_revenue, 2); ?></span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 1.5rem; padding: 1rem; background: rgba(200, 35, 51, 0.1); border-radius: 8px;">
                        <span style="font-weight: 600; color: var(--danger);">Expenses:</span>
                        <span style="font-weight: 700; color: var(--danger);">₱<?php echo number_format($monthly_expenses, 2); ?></span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 1rem; background: rgba(40, 167, 69, 0.1); border-radius: 8px; border: 2px solid var(--success);">
                        <span style="font-weight: 600; color: var(--success);">Net Profit:</span>
                        <span style="font-weight: 700; font-size: 1.2rem; color: var(--success);">₱<?php echo number_format($monthly_profit, 2); ?></span>
                    </div>
                </div>
            </div>

            <!-- Batch Performance -->
            <div class="chart-container" style="grid-column: span 2;">
                <h3>Top Performing Batches</h3>
                <div class="chart-wrapper">
                    <canvas id="batchPerformanceChart"></canvas>
                </div>
            </div>
        </div>

        <!-- Performance Metrics Grid -->
        <div class="performance-metrics">
            <h3>📊 Key Performance Indicators</h3>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-icon">📈</div>
                    <div class="metric-value"><?php echo number_format(array_sum($egg_chart_data) / 30, 1); ?></div>
                    <div class="metric-label">Avg. Daily Eggs</div>
                    <div class="metric-change positive">+5.2% vs last month</div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon">🎯</div>
                    <div class="metric-value"><?php echo $quality_rate; ?>%</div>
                    <div class="metric-label">Quality Rate</div>
                    <div class="metric-change <?php echo $quality_rate >= 85 ? 'positive' : 'negative'; ?>">
                        <?php echo $quality_rate >= 85 ? 'Excellent' : 'Needs Improvement'; ?>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon">💪</div>
                    <div class="metric-value"><?php echo $stats['avg_production_rate']; ?>%</div>
                    <div class="metric-label">Production Rate</div>
                    <div class="metric-change <?php echo $stats['avg_production_rate'] >= 60 ? 'positive' : 'negative'; ?>">
                        <?php echo $stats['avg_production_rate'] >= 60 ? 'Good' : 'Low'; ?>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon">🐥</div>
                    <div class="metric-value"><?php echo $stats['mortality_rate']; ?>%</div>
                    <div class="metric-label">Mortality Rate</div>
                    <div class="metric-change <?php echo $stats['mortality_rate'] < 3 ? 'positive' : 'negative'; ?>">
                        <?php echo $stats['mortality_rate'] < 3 ? 'Healthy' : 'Attention Needed'; ?>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Activities -->
        <div class="activities">
            <h3>📋 Recent Activities</h3>
            <div id="recentActivities">
                <?php if (empty($recent_activities)): ?>
                    <div class="activity-item">
                        No recent activities found.
                        <span class="activity-time">Just now</span>
                    </div>
                <?php else: ?>
                    <?php foreach ($recent_activities as $activity): ?>
                        <div class="activity-item">
                            <?php echo htmlspecialchars($activity['activity_description']); ?>
                            <span class="activity-time"><?php echo time_elapsed_string($activity['created_at']); ?></span>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <script>
        // Chart.js Configuration
        const chartColors = {
            primary: '#2d5016',
            secondary: '#4a7c59',
            lightGreen: '#6b9d7a',
            brown: '#6b4423',
            success: '#28a745',
            danger: '#c82333',
            warning: '#d39e00'
        };

        // Egg Production Chart
        const eggCtx = document.getElementById('eggProductionChart').getContext('2d');
        new Chart(eggCtx, {
            type: 'line',
            data: {
                labels: <?php echo json_encode($egg_chart_labels); ?>,
                datasets: [{
                    label: 'Daily Egg Production',
                    data: <?php echo json_encode($egg_chart_data); ?>,
                    borderColor: chartColors.primary,
                    backgroundColor: 'rgba(45, 80, 22, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 7,
                    pointBackgroundColor: chartColors.primary,
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
                        labels: {
                            color: chartColors.primary,
                            font: { size: 12, weight: '600' }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.parsed.y + ' eggs';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + ' eggs';
                            },
                            color: chartColors.brown
                        },
                        grid: {
                            color: 'rgba(107, 68, 35, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: chartColors.brown
                        },
                        grid: {
                            color: 'rgba(107, 68, 35, 0.1)'
                        }
                    }
                }
            }
        });

        // Quality Chart
        const qualityCtx = document.getElementById('qualityChart').getContext('2d');
        new Chart(qualityCtx, {
            type: 'doughnut',
            data: {
                labels: ['Good', 'Cracked', 'Dirty', 'Small'],
                datasets: [{
                    data: [
                        <?php echo $quality_metrics['good'] ?? 0; ?>,
                        <?php echo $quality_metrics['cracked'] ?? 0; ?>,
                        <?php echo $quality_metrics['dirty'] ?? 0; ?>,
                        <?php echo $quality_metrics['small'] ?? 0; ?>
                    ],
                    backgroundColor: [
                        chartColors.success,
                        chartColors.danger,
                        chartColors.warning,
                        chartColors.secondary
                    ],
                    borderWidth: 3,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        position: 'bottom',
                        labels: {
                            color: chartColors.brown,
                            font: { size: 11, weight: '600' },
                            padding: 15
                        }
                    }
                }
            }
        });

        // Batch Performance Chart
        const batchCtx = document.getElementById('batchPerformanceChart').getContext('2d');
        new Chart(batchCtx, {
            type: 'bar',
            data: {
                labels: <?php echo json_encode(array_column($batch_performance, 'batch_name')); ?>,
                datasets: [{
                    label: 'Duck Count',
                    data: <?php echo json_encode(array_column($batch_performance, 'current_count')); ?>,
                    backgroundColor: chartColors.primary,
                    borderColor: chartColors.brown,
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: chartColors.brown
                        },
                        grid: {
                            color: 'rgba(107, 68, 35, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: chartColors.brown
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

        // Update current date/time
        function updateDateTime() {
            const now = new Date();
            const options = { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            document.getElementById('currentDateTime').textContent = now.toLocaleDateString('en-US', options);
        }
        updateDateTime();
        setInterval(updateDateTime, 60000);
    </script>
</body>
</html>

<?php
function time_elapsed_string($datetime, $full = false) {
    $now = new DateTime;
    $ago = new DateTime($datetime);
    $diff = $now->diff($ago);

    $weeks = floor($diff->days / 7);
    $days = $diff->days - ($weeks * 7);

    $string = array(
        'y' => $diff->y ? $diff->y . ' year' . ($diff->y > 1 ? 's' : '') : '',
        'm' => $diff->m ? $diff->m . ' month' . ($diff->m > 1 ? 's' : '') : '',
        'w' => $weeks ? $weeks . ' week' . ($weeks > 1 ? 's' : '') : '',
        'd' => $days ? $days . ' day' . ($days > 1 ? 's' : '') : '',
        'h' => $diff->h ? $diff->h . ' hour' . ($diff->h > 1 ? 's' : '') : '',
        'i' => $diff->i ? $diff->i . ' minute' . ($diff->i > 1 ? 's' : '') : '',
        's' => $diff->s ? $diff->s . ' second' . ($diff->s > 1 ? 's' : '') : '',
    );

    $string = array_filter($string);

    if (!$full) {
        $string = array_slice($string, 0, 1);
    }

    return $string ? implode(', ', $string) . ' ago' : 'just now';
}

$conn->close();
?>