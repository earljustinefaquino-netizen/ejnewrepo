<?php
session_start();
require_once 'includes/dbconnection.php';

// Include the user profile handler
require_once 'includes/user_profile.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit;
}

$user_id = $_SESSION['user_id'];
$fullname = $_SESSION['fullname'];
$profile_pic = isset($_SESSION['profile_pic']) ? $_SESSION['profile_pic'] : 'assets/images/default_user.png';

// Get active batches for dropdown (only laying batches)
$batches_query = "SELECT batch_id, batch_name, batch_code, current_count FROM duck_batches 
                  WHERE farmer_id = ? AND status IN ('Laying', 'Peak Production', 'Declining') 
                  ORDER BY batch_name ASC";
$batches_stmt = $conn->prepare($batches_query);
$batches_stmt->bind_param("i", $user_id);
$batches_stmt->execute();
$batches_result = $batches_stmt->get_result();

// Get egg collection history
$history_query = "SELECT ec.*, db.batch_name, db.batch_code, db.current_count 
                  FROM egg_collection ec
                  JOIN duck_batches db ON ec.batch_id = db.batch_id
                  WHERE ec.farmer_id = ?
                  ORDER BY ec.collection_date DESC
                  LIMIT 30";
$history_stmt = $conn->prepare($history_query);
$history_stmt->bind_param("i", $user_id);
$history_stmt->execute();
$history_result = $history_stmt->get_result();

// Calculate summary statistics
$today_total = 0;
$week_total = 0;
$month_total = 0;
$today_quality_rate = 0;

// Today's eggs
$today_query = "SELECT SUM(total_eggs) as total, SUM(good_eggs) as good 
                FROM egg_collection 
                WHERE farmer_id = ? AND collection_date = CURDATE()";
$stmt = $conn->prepare($today_query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$today_data = $result->fetch_assoc();
$today_total = $today_data['total'] ?? 0;
$today_good = $today_data['good'] ?? 0;
$today_quality_rate = $today_total > 0 ? round(($today_good / $today_total) * 100, 1) : 0;

// This week's eggs
$week_query = "SELECT SUM(total_eggs) as total FROM egg_collection 
               WHERE farmer_id = ? AND YEARWEEK(collection_date) = YEARWEEK(CURDATE())";
$stmt = $conn->prepare($week_query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$week_data = $result->fetch_assoc();
$week_total = $week_data['total'] ?? 0;

// This month's eggs
$month_query = "SELECT SUM(total_eggs) as total FROM egg_collection 
                WHERE farmer_id = ? AND MONTH(collection_date) = MONTH(CURDATE()) 
                AND YEAR(collection_date) = YEAR(CURDATE())";
$stmt = $conn->prepare($month_query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$month_data = $result->fetch_assoc();
$month_total = $month_data['total'] ?? 0;
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
<link rel="stylesheet" href="assets/css/eggs.css">
    
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
    <li><a href="eggs.php" class="active">🥚 Egg Collection</a></li>
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
                <img src="assets/images/logo1.png" alt="AgriDuck Logo" class="top-logo" onerror="this.style.display='none'">
                <h1>AGRI-<span>DUCK</span></h1>
            </div>
            <div class="right-header">
                <form class="search-form">
                    <input type="text" placeholder="Search collections..." id="searchEggs">
                </form>
                <a href="includes/logout.php" class="logout-btn">Logout</a>
            </div>
        </div>

        <!-- Page Header -->
        <div class="page-header">
            <h2>Egg Collection Management</h2>
            <div class="header-actions">
                <button class="btn btn-primary" onclick="document.getElementById('collectionForm').scrollIntoView({behavior: 'smooth'})">
                    Record Collection
                </button>
                <button class="btn btn-secondary" onclick="exportEggData()">
                    Export Report
                </button>
            </div>
        </div>

        <!-- Summary Cards -->
        <div class="summary-cards">
            <div class="summary-card">
                <div class="card-icon">🥚</div>
                <div class="card-info">
                    <h3><?php echo number_format($today_total); ?></h3>
                    <p>Today's Eggs</p>
                </div>
            </div>
            <div class="summary-card">
                <div class="card-icon">📅</div>
                <div class="card-info">
                    <h3><?php echo number_format($week_total); ?></h3>
                    <p>This Week</p>
                </div>
            </div>
            <div class="summary-card">
                <div class="card-icon">📊</div>
                <div class="card-info">
                    <h3><?php echo number_format($month_total); ?></h3>
                    <p>This Month</p>
                </div>
            </div>
            <div class="summary-card">
                <div class="card-icon">✨</div>
                <div class="card-info">
                    <h3><?php echo $today_quality_rate; ?>%</h3>
                    <p>Quality Rate</p>
                </div>
            </div>
        </div>

        <!-- Collection Form -->
        <div class="collection-form" id="collectionForm">
            <h3>Record Daily Egg Collection</h3>
            <form id="eggCollectionForm" onsubmit="recordEggs(event)">
                <div class="form-row">
                    <div class="form-group">
                        <label for="collectionDate">Collection Date:</label>
                        <input type="date" id="collectionDate" name="collectionDate" required value="<?php echo date('Y-m-d'); ?>">
                    </div>
                    <div class="form-group">
                        <label for="batchId">Batch:</label>
                        <select id="batchId" name="batchId" required onchange="updateBatchInfo()">
                            <option value="">Select Batch</option>
                            <?php while ($batch = $batches_result->fetch_assoc()): ?>
                                <option value="<?php echo $batch['batch_id']; ?>" data-count="<?php echo $batch['current_count']; ?>">
                                    <?php echo htmlspecialchars($batch['batch_name'] . ' (' . $batch['batch_code'] . ') - ' . $batch['current_count'] . ' ducks'); ?>
                                </option>
                            <?php endwhile; ?>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="collectionTime">Collection Time:</label>
                        <select id="collectionTime" name="collectionTime">
                            <option value="Morning">Morning</option>
                            <option value="Afternoon">Afternoon</option>
                            <option value="Evening">Evening</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="totalEggs">Total Eggs Collected:</label>
                        <input type="number" id="totalEggs" name="totalEggs" min="0" required oninput="calculateQuality()">
                    </div>
                    <div class="form-group">
                        <label for="goodEggs">Good Quality Eggs:</label>
                        <input type="number" id="goodEggs" name="goodEggs" min="0" required oninput="calculateQuality()">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="crackedEggs">Cracked Eggs:</label>
                        <input type="number" id="crackedEggs" name="crackedEggs" min="0" value="0" oninput="calculateQuality()">
                    </div>
                    <div class="form-group">
                        <label for="dirtyEggs">Dirty Eggs:</label>
                        <input type="number" id="dirtyEggs" name="dirtyEggs" min="0" value="0" oninput="calculateQuality()">
                    </div>
                    <div class="form-group">
                        <label for="smallEggs">Small Eggs:</label>
                        <input type="number" id="smallEggs" name="smallEggs" min="0" value="0" oninput="calculateQuality()">
                    </div>
                </div>

                <div class="egg-summary">
                    <h4>Collection Summary</h4>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <div class="summary-value" id="qualityRate">0%</div>
                            <div class="summary-label">Quality Rate</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-value" id="productionRate">0%</div>
                            <div class="summary-label">Production Rate</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-value" id="avgPerDuck">0</div>
                            <div class="summary-label">Avg per Duck</div>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label for="weatherCondition">Weather Condition:</label>
                    <select id="weatherCondition" name="weatherCondition">
                        <option value="Sunny">Sunny</option>
                        <option value="Cloudy">Cloudy</option>
                        <option value="Rainy">Rainy</option>
                        <option value="Stormy">Stormy</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="notes">Notes (Optional):</label>
                    <textarea id="notes" name="notes" rows="3" placeholder="Any observations about today's collection..."></textarea>
                </div>

                <button type="submit" class="btn btn-primary">Record Collection</button>
                <button type="reset" class="btn btn-secondary" onclick="resetForm()">Clear Form</button>
            </form>
        </div>

        <!-- Collection History -->
        <div class="collection-history">
            <h3>Collection History</h3>
            <div class="table-container">
                <table class="batches-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Batch</th>
                            <th>Time</th>
                            <th>Total Eggs</th>
                            <th>Good</th>
                            <th>Cracked</th>
                            <th>Dirty</th>
                            <th>Small</th>
                            <th>Quality Rate</th>
                            <th>Production Rate</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if ($history_result->num_rows > 0): ?>
                            <?php while($record = $history_result->fetch_assoc()): 
                                $quality_rate = $record['total_eggs'] > 0 ? round(($record['good_eggs'] / $record['total_eggs']) * 100, 1) : 0;
                                $production_rate = $record['current_count'] > 0 ? round(($record['total_eggs'] / $record['current_count']) * 100, 1) : 0;
                            ?>
                            <tr>
                                <td><?php echo date('M d, Y', strtotime($record['collection_date'])); ?></td>
                                <td><?php echo htmlspecialchars($record['batch_name']); ?></td>
                                <td><?php echo $record['collection_time'] ?? 'Morning'; ?></td>
                                <td><strong><?php echo number_format($record['total_eggs']); ?></strong></td>
                                <td><span class="quality-badge quality-good"><?php echo number_format($record['good_eggs']); ?></span></td>
                                <td><span class="quality-badge quality-cracked"><?php echo number_format($record['cracked_eggs']); ?></span></td>
                                <td><span class="quality-badge quality-dirty"><?php echo number_format($record['dirty_eggs']); ?></span></td>
                                <td><?php echo number_format($record['small_eggs']); ?></td>
                                <td><?php echo $quality_rate; ?>%</td>
                                <td><?php echo $production_rate; ?>%</td>
                                <td class="actions">
                                    <button class="btn-icon" onclick="editCollection(<?php echo $record['collection_id']; ?>)" title="Edit">✏️</button>
                                    <button class="btn-icon" onclick="deleteCollection(<?php echo $record['collection_id']; ?>)" title="Delete">🗑️</button>
                                </td>
                            </tr>
                            <?php endwhile; ?>
                        <?php else: ?>
                            <tr>
                                <td colspan="11" style="text-align: center; padding: 2rem; color: var(--gray);">
                                    No egg collections recorded yet. Start recording your daily collections above.
                                </td>
                            </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <script src="assets/js/eggs.js"></script>
    <script>
        function updateBatchInfo() {
            const select = document.getElementById('batchId');
            const option = select.options[select.selectedIndex];
            const duckCount = option.dataset.count || 0;
            
            // Store for calculations
            window.currentBatchDucks = parseInt(duckCount);
            calculateQuality();
        }

        function calculateQuality() {
            const total = parseInt(document.getElementById('totalEggs').value) || 0;
            const good = parseInt(document.getElementById('goodEggs').value) || 0;
            const duckCount = window.currentBatchDucks || 1;
            
            // Quality rate
            const qualityRate = total > 0 ? Math.round((good / total) * 100) : 0;
            document.getElementById('qualityRate').textContent = qualityRate + '%';
            
            // Production rate (eggs per duck percentage)
            const productionRate = duckCount > 0 ? Math.round((total / duckCount) * 100) : 0;
            document.getElementById('productionRate').textContent = productionRate + '%';
            
            // Average per duck
            const avgPerDuck = duckCount > 0 ? (total / duckCount).toFixed(2) : '0.00';
            document.getElementById('avgPerDuck').textContent = avgPerDuck;
        }

        function resetForm() {
            document.getElementById('qualityRate').textContent = '0%';
            document.getElementById('productionRate').textContent = '0%';
            document.getElementById('avgPerDuck').textContent = '0';
        }
    </script>
</body>
</html>
<?php $conn->close(); ?>