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

// Get date range (default: last 30 days)
$start_date = isset($_GET['start_date']) ? $_GET['start_date'] : date('Y-m-d', strtotime('-30 days'));
$end_date = isset($_GET['end_date']) ? $_GET['end_date'] : date('Y-m-d');

// ==========================================
// FIXED: Production Report - Use cracked_eggs column
// ==========================================
$production_data = [];
$prod_query = "SELECT 
                collection_date, 
                SUM(total_eggs) as eggs,
                SUM(good_eggs) as good_eggs,
                SUM(cracked_eggs) as cracked_eggs
               FROM egg_collection 
               WHERE farmer_id = ? AND collection_date BETWEEN ? AND ?
               GROUP BY collection_date 
               ORDER BY collection_date";
$stmt = $conn->prepare($prod_query);
$stmt->bind_param("iss", $user_id, $start_date, $end_date);
$stmt->execute();
$result = $stmt->get_result();
while ($row = $result->fetch_assoc()) {
    $production_data[] = $row;
}

// Financial Summary - Sales Revenue
$financial_query = "SELECT 
    SUM(total_amount) as total_revenue,
    COUNT(*) as total_transactions,
    SUM(CASE WHEN product_type = 'Eggs' OR product_type = 'Egg' THEN total_amount ELSE 0 END) as egg_sales,
    SUM(CASE WHEN product_type = 'Ducks' OR product_type = 'Duck' THEN total_amount ELSE 0 END) as duck_sales
    FROM sales 
    WHERE farmer_id = ? AND sale_date BETWEEN ? AND ?";
$stmt = $conn->prepare($financial_query);
$stmt->bind_param("iss", $user_id, $start_date, $end_date);
$stmt->execute();
$result = $stmt->get_result();
$financial = $result->fetch_assoc();

// ==========================================
// FIXED: Get Expenses from Feed Inventory
// ==========================================
$expense_query = "SELECT 
    COALESCE(SUM(total_cost), 0) as total_expenses,
    COUNT(*) as feed_purchases,
    COALESCE(SUM(quantity_bags), 0) as total_bags
    FROM feed_inventory 
    WHERE farmer_id = ? 
    AND purchase_date BETWEEN ? AND ?";
$stmt = $conn->prepare($expense_query);
$stmt->bind_param("iss", $user_id, $start_date, $end_date);
$stmt->execute();
$result = $stmt->get_result();
$expenses = $result->fetch_assoc();

// Get feed expense breakdown by type
$feed_breakdown_query = "SELECT 
    feed_type,
    SUM(total_cost) as type_cost,
    SUM(quantity_bags) as type_bags,
    COUNT(*) as purchases
    FROM feed_inventory 
    WHERE farmer_id = ? 
    AND purchase_date BETWEEN ? AND ?
    GROUP BY feed_type
    ORDER BY type_cost DESC";
$stmt = $conn->prepare($feed_breakdown_query);
$stmt->bind_param("iss", $user_id, $start_date, $end_date);
$stmt->execute();
$result = $stmt->get_result();
$feed_breakdown = [];
while ($row = $result->fetch_assoc()) {
    $feed_breakdown[] = $row;
}

// Calculate totals
$total_revenue = floatval($financial['total_revenue'] ?? 0);
$total_expenses = floatval($expenses['total_expenses'] ?? 0);
$net_income = $total_revenue - $total_expenses;
$profit_margin = $total_revenue > 0 ? ($net_income / $total_revenue) * 100 : 0;

// Get batch statistics
$batch_stats_query = "SELECT 
    COUNT(*) as total_batches,
    COALESCE(SUM(current_count), 0) as total_ducks,
    COALESCE(AVG(current_count), 0) as avg_batch_size
    FROM duck_batches 
    WHERE farmer_id = ? 
    AND status != 'Retired'";
$stmt = $conn->prepare($batch_stats_query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$batch_stats = $result->fetch_assoc();

$conn->close();
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
<link rel="stylesheet" href="assets/css/reports_fixed.css">
    
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
            <li><a href="dashboard.php">📊 Dashboard</a></li>
            <li><a href="batches.php">🦆 Duck Batches</a></li>
            <li><a href="feed.php">🌽 Feed Inventory</a></li>
            <li><a href="eggs.php">🥚 Egg Collection</a></li>
            <li><a href="sales.php">💵 Sales</a></li>
            <li><a href="reports.php" class="active">📊 Reports</a></li>
            <li><a href="profile.php">👤 Profile/Settings</a></li>
        </ul>
    </div>

    <!-- MAIN CONTENT -->
    <div class="main-content">
        <!-- Topbar -->
        <div class="topbar">
            <div class="left-header">
                <img src="assets/images/logo1.png" alt="AgriDuck Logo" class="top-logo" onerror="this.style.display='none'">
                <h1>AGRI-<span>DUCK</span></h1>
            </div>
            <div class="right-header">
                <a href="includes/logout.php" class="logout-btn">Logout</a>
            </div>
        </div>

        <!-- Page Header -->
        <div class="page-header">
            <h2>📊 Reports & Analytics</h2>
            <div class="header-actions">
                <button class="btn btn-secondary" onclick="exportReport()">
                    📄 Export PDF
                </button>
            </div>
        </div>

        <!-- Date Range Filter -->
        <div class="filters-section">
            <form method="GET" action="reports.php" id="reportForm">
                <div class="filter-group">
                    <label for="start_date">From:</label>
                    <input type="date" id="start_date" name="start_date" value="<?php echo $start_date; ?>" required>
                </div>
                <div class="filter-group">
                    <label for="end_date">To:</label>
                    <input type="date" id="end_date" name="end_date" value="<?php echo $end_date; ?>" required>
                </div>
                <button type="submit" class="btn btn-primary">Generate Report</button>
                
                <!-- Preset buttons will be dynamically added by JavaScript -->
            </form>
        </div>

        <!-- Financial Summary -->
        <div class="report-section">
            <h3>💰 Financial Summary (<?php echo date('M d, Y', strtotime($start_date)); ?> - <?php echo date('M d, Y', strtotime($end_date)); ?>)</h3>
            <div class="summary-cards">
                <div class="summary-card">
                    <div class="card-icon">💰</div>
                    <div class="card-info">
                        <h3>₱<?php echo number_format($total_revenue, 2); ?></h3>
                        <p>Total Revenue</p>
                        <small><?php echo number_format($financial['total_transactions'] ?? 0); ?> transactions</small>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="card-icon">💸</div>
                    <div class="card-info">
                        <h3>₱<?php echo number_format($total_expenses, 2); ?></h3>
                        <p>Total Expenses (Feed)</p>
                        <small><?php echo number_format($expenses['feed_purchases'] ?? 0); ?> feed purchases</small>
                    </div>
                </div>
                <div class="summary-card <?php echo $net_income >= 0 ? '' : 'alert'; ?>">
                    <div class="card-icon"><?php echo $net_income >= 0 ? '📈' : '📉'; ?></div>
                    <div class="card-info">
                        <h3 style="color: <?php echo $net_income >= 0 ? '#28a745' : '#dc3545'; ?>">
                            ₱<?php echo number_format($net_income, 2); ?>
                        </h3>
                        <p>Net Income</p>
                        <small><?php echo number_format($profit_margin, 1); ?>% profit margin</small>
                    </div>
                </div>
            </div>
        </div>

        <!-- Revenue Breakdown -->
        <div class="report-section">
            <h3>📊 Revenue Breakdown</h3>
            <div class="summary-cards" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
                <div class="kpi-card">
                    <div class="kpi-label">🥚 Egg Sales</div>
                    <div class="kpi-value">₱<?php echo number_format($financial['egg_sales'] ?? 0, 2); ?></div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">🦆 Duck Sales</div>
                    <div class="kpi-value">₱<?php echo number_format($financial['duck_sales'] ?? 0, 2); ?></div>
                </div>
            </div>
        </div>

        <!-- Feed Expense Breakdown -->
        <?php if (!empty($feed_breakdown)): ?>
        <div class="report-section">
            <h3>🌽 Feed Expenses by Type</h3>
            <div class="table-container">
                <table class="batches-table">
                    <thead>
                        <tr>
                            <th>Feed Type</th>
                            <th>Total Cost</th>
                            <th>Bags Purchased</th>
                            <th>Purchases</th>
                            <th>Avg Cost/Bag</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php 
                        $total_feed_cost = 0;
                        $total_feed_bags = 0;
                        foreach($feed_breakdown as $feed): 
                            $total_feed_cost += $feed['type_cost'];
                            $total_feed_bags += $feed['type_bags'];
                            $avg_cost = $feed['type_bags'] > 0 ? $feed['type_cost'] / $feed['type_bags'] : 0;
                        ?>
                        <tr>
                            <td><strong><?php echo htmlspecialchars($feed['feed_type']); ?></strong></td>
                            <td>₱<?php echo number_format($feed['type_cost'], 2); ?></td>
                            <td><?php echo number_format($feed['type_bags']); ?> bags</td>
                            <td><?php echo number_format($feed['purchases']); ?></td>
                            <td>₱<?php echo number_format($avg_cost, 2); ?></td>
                        </tr>
                        <?php endforeach; ?>
                        <tr style="background: rgba(74, 124, 89, 0.1); font-weight: 700;">
                            <td>TOTAL</td>
                            <td>₱<?php echo number_format($total_feed_cost, 2); ?></td>
                            <td><?php echo number_format($total_feed_bags); ?> bags</td>
                            <td><?php echo number_format(array_sum(array_column($feed_breakdown, 'purchases'))); ?></td>
                            <td>-</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <?php endif; ?>

        <!-- Production Chart -->
<div class="chart-container">
    <h3>🥚 Egg Production Trend</h3>
    
    
    <canvas id="productionChart"></canvas>
</div>

        <!-- Production Details Table -->
        <div class="report-section">
            <h3>📋 Production Details</h3>
            <div class="table-container">
                <table class="batches-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Total Eggs</th>
                            <th>Good Eggs</th>
                            <th>Cracked Eggs</th>
                            <th>Quality Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php 
                        // Initialize totals BEFORE the loop
                        $total_eggs = 0;
                        $total_good = 0;
                        $total_cracked = 0;
                        $avg_quality = 0;
                        
                        if (empty($production_data)): 
                        ?>
                        <tr>
                            <td colspan="5" style="text-align: center; padding: 2rem; color: #999;">
                                📋 No production data for selected date range
                            </td>
                        </tr>
                        <?php else: 
                            // Loop through production data
                            foreach($production_data as $prod): 
                                $total_eggs += $prod['eggs'];
                                $total_good += $prod['good_eggs'];
                                $total_cracked += $prod['cracked_eggs'];
                                $quality_rate = $prod['eggs'] > 0 ? ($prod['good_eggs'] / $prod['eggs']) * 100 : 0;
                        ?>
                        <tr>
                            <td><?php echo date('M d, Y', strtotime($prod['collection_date'])); ?></td>
                            <td><?php echo number_format($prod['eggs']); ?></td>
                            <td style="color: #28a745;"><strong><?php echo number_format($prod['good_eggs']); ?></strong></td>
                            <td style="color: #dc3545;"><?php echo number_format($prod['cracked_eggs']); ?></td>
                            <td>
                                <span style="color: <?php echo $quality_rate >= 90 ? '#28a745' : ($quality_rate >= 80 ? '#ffc107' : '#dc3545'); ?>">
                                    <strong><?php echo number_format($quality_rate, 1); ?>%</strong>
                                </span>
                            </td>
                        </tr>
                        <?php 
                            endforeach;
                            
                            // Calculate average quality AFTER the loop
                            $avg_quality = $total_eggs > 0 ? ($total_good / $total_eggs) * 100 : 0;
                        ?>
                        <tr style="background: rgba(74, 124, 89, 0.1); font-weight: 700;">
                            <td>TOTAL</td>
                            <td><?php echo number_format($total_eggs); ?></td>
                            <td style="color: #28a745;"><?php echo number_format($total_good); ?></td>
                            <td style="color: #dc3545;"><?php echo number_format($total_cracked); ?></td>
                            <td style="color: #4a7c59;"><?php echo number_format($avg_quality, 1); ?>%</td>
                        </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Key Performance Indicators -->
        <div class="report-section">
            <h3>📈 Key Performance Indicators</h3>
            <div class="kpi-grid">
                <div class="kpi-card">
                    <div class="kpi-label">🦆 Active Ducks</div>
                    <div class="kpi-value"><?php echo number_format($batch_stats['total_ducks'] ?? 0); ?></div>
                    <small><?php echo number_format($batch_stats['total_batches'] ?? 0); ?> batches</small>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">🥚 Avg Daily Production</div>
                    <div class="kpi-value">
                        <?php 
                        $days = count($production_data);
                        echo $days > 0 ? number_format($total_eggs / $days, 0) : 0; 
                        ?> eggs
                    </div>
                    <small>Per day average</small>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">💰 Revenue per Duck</div>
                    <div class="kpi-value">
                        ₱<?php 
                        $ducks = $batch_stats['total_ducks'] ?? 0;
                        echo $ducks > 0 ? number_format($total_revenue / $ducks, 2) : '0.00'; 
                        ?>
                    </div>
                    <small>Per duck in period</small>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">📊 Quality Rate</div>
                    <div class="kpi-value" style="color: <?php echo $avg_quality >= 90 ? '#28a745' : ($avg_quality >= 80 ? '#ffc107' : '#dc3545'); ?>">
                        <?php echo number_format($avg_quality, 1); ?>%
                    </div>
                    <small>Good eggs percentage</small>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">🌽 Feed Cost/Egg</div>
                    <div class="kpi-value">
                        ₱<?php 
                        echo $total_eggs > 0 ? number_format($total_expenses / $total_eggs, 2) : '0.00'; 
                        ?>
                    </div>
                    <small>Cost per egg produced</small>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">📈 Profit Margin</div>
                    <div class="kpi-value" style="color: <?php echo $profit_margin >= 30 ? '#28a745' : ($profit_margin >= 10 ? '#ffc107' : '#dc3545'); ?>">
                        <?php echo number_format($profit_margin, 1); ?>%
                    </div>
                    <small>Net income / Revenue</small>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Pass PHP data to JavaScript
        window.productionData = <?php echo json_encode($production_data); ?>;
        window.dateRange = {
            start: '<?php echo $start_date; ?>',
            end: '<?php echo $end_date; ?>'
        };
        
        // Export report function
        function exportReport() {
            const startDate = document.getElementById('start_date').value;
            const endDate = document.getElementById('end_date').value;
            window.open(`api/report/export_report.php?start_date=${startDate}&end_date=${endDate}`, '_blank');
        }
    </script>
    <script src="assets/js/report/reports.js"></script>
</body>
</html>