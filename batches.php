<?php
session_start();
require_once 'includes/dbconnection.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit;
}

$user_id = $_SESSION['user_id'];
$fullname = $_SESSION['fullname'];
$profile_pic = isset($_SESSION['profile_pic']) ? $_SESSION['profile_pic'] : 'assets/images/default_user.png';

// Fetch all batches for this user
$batches_query = "SELECT * FROM duck_batches WHERE farmer_id = ? ORDER BY start_date DESC";
$stmt = $conn->prepare($batches_query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$batches_result = $stmt->get_result();

// Calculate summary statistics WITHOUT sold ducks (handled in Sales page)
$summary_query = "SELECT 
    SUM(current_count) as total_ducks,
    SUM(CASE WHEN status IN ('Laying', 'Peak Production') THEN current_count ELSE 0 END) as laying_ducks,
    SUM(mortality_count) as total_mortality,
    COALESCE(SUM(missing_count), 0) as total_missing,
    COALESCE(SUM(mortality_count + missing_count), 0) as total_losses,
    COUNT(CASE WHEN status != 'Retired' THEN 1 END) as active_batches,
    COUNT(*) as total_batches,
    ROUND(AVG(CASE WHEN initial_count > 0 THEN (mortality_count / initial_count * 100) ELSE 0 END), 2) as avg_mortality_rate,
    ROUND(AVG(CASE WHEN initial_count > 0 THEN (COALESCE(missing_count, 0) / initial_count * 100) ELSE 0 END), 2) as avg_missing_rate,
    ROUND(AVG(CASE WHEN initial_count > 0 THEN ((mortality_count + COALESCE(missing_count, 0)) / initial_count * 100) ELSE 0 END), 2) as avg_total_loss_rate
    FROM duck_batches 
    WHERE farmer_id = ?";
$stmt = $conn->prepare($summary_query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$summary = $result->fetch_assoc();

$total_ducks = $summary['total_ducks'] ?? 0;
$laying_ducks = $summary['laying_ducks'] ?? 0;
$total_mortality = $summary['total_mortality'] ?? 0;
$total_missing = $summary['total_missing'] ?? 0;
$total_losses = $summary['total_losses'] ?? 0;
$active_batches = $summary['active_batches'] ?? 0;
$total_batches = $summary['total_batches'] ?? 0;
$avg_mortality_rate = $summary['avg_mortality_rate'] ?? 0;
$avg_missing_rate = $summary['avg_missing_rate'] ?? 0;
$avg_total_loss_rate = $summary['avg_total_loss_rate'] ?? 0;

// Get breed distribution
$breed_query = "SELECT breed, SUM(current_count) as count 
                FROM duck_batches 
                WHERE farmer_id = ? AND status != 'Retired'
                GROUP BY breed 
                ORDER BY count DESC";
$stmt = $conn->prepare($breed_query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$breed_result = $stmt->get_result();
$breed_distribution = [];
while ($row = $breed_result->fetch_assoc()) {
    $breed_distribution[] = $row;
}

// Get batch age distribution
$age_query = "SELECT 
    SUM(CASE WHEN DATEDIFF(CURDATE(), start_date) <= 56 THEN current_count ELSE 0 END) as young,
    SUM(CASE WHEN DATEDIFF(CURDATE(), start_date) > 56 AND DATEDIFF(CURDATE(), start_date) <= 112 THEN current_count ELSE 0 END) as growing,
    SUM(CASE WHEN DATEDIFF(CURDATE(), start_date) > 112 AND DATEDIFF(CURDATE(), start_date) <= 210 THEN current_count ELSE 0 END) as mature,
    SUM(CASE WHEN DATEDIFF(CURDATE(), start_date) > 210 THEN current_count ELSE 0 END) as senior
    FROM duck_batches 
    WHERE farmer_id = ? AND status != 'Retired'";
$stmt = $conn->prepare($age_query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$age_result = $stmt->get_result();
$age_distribution = $age_result->fetch_assoc();

// Reset result pointer for main loop
$stmt = $conn->prepare($batches_query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$batches_result = $stmt->get_result();
?>

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
<link rel="stylesheet" href="assets/css/batches_fixed.css">
    
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
            <li><a href="batches.php" class="active">🦆 Duck Batches</a></li>
            <li><a href="feed.php">🌽 Feed Inventory</a></li>
            <li><a href="eggs.php">🥚 Egg Collection</a></li>
            <li><a href="sales.php">💵 Sales</a></li>
            <li><a href="reports.php">📊 Reports</a></li>
            <li><a href="profile.php">👤 Profile/Settings</a></li>
        </ul>
    </div>

    <!-- MAIN CONTENT -->
    <div class="main-content">
        <!-- Topbar - FIXED VERSION -->
        <div class="topbar">
            <div class="left-header">
                <img src="assets/images/logo1.png" alt="AgriDuck Logo" class="top-logo">
                <h1>AGRI-<span>DUCK</span></h1>
            </div>
            <div class="right-header">
                <form class="search-form" onsubmit="return false;">
                    <input type="text" placeholder="Search batches..." id="searchBatches">
                </form>
                <a href="includes/logout.php" class="logout-btn">Logout</a>
            </div>
        </div>

        <!-- Page Header -->
        <div class="page-header">
            <h2>Duck Batch Management</h2>
            <div class="header-actions">
                <button class="btn btn-primary" onclick="window.batchModule.openAddBatchModal()">
                    ➕ Add New Batch
                </button>
                <button class="btn btn-secondary" onclick="window.batchModule.exportBatches()">
                    📥 Export Report
                </button>
            </div>
        </div>

        <!-- Summary Cards - REMOVED SOLD CARD -->
        <div class="summary-cards">
            <div class="summary-card">
                <div class="card-icon">🦆</div>
                <div class="card-info">
                    <h3><?php echo number_format($total_ducks); ?></h3>
                    <p>Total Ducks</p>
                    <small style="color: var(--gray);"><?php echo $total_batches; ?> batches</small>
                </div>
            </div>
            <div class="summary-card">
                <div class="card-icon">📦</div>
                <div class="card-info">
                    <h3><?php echo number_format($active_batches); ?></h3>
                    <p>Active Batches</p>
                    <small style="color: var(--gray);">Currently managed</small>
                </div>
            </div>
            <div class="summary-card">
                <div class="card-icon">🥚</div>
                <div class="card-info">
                    <h3><?php echo number_format($laying_ducks); ?></h3>
                    <p>Laying Ducks</p>
                    <small style="color: var(--gray);">
                        <?php echo $total_ducks > 0 ? round(($laying_ducks / $total_ducks) * 100, 1) : 0; ?>% of total
                    </small>
                </div>
            </div>
            <div class="summary-card">
                <div class="card-icon">⚠️</div>
                <div class="card-info">
                    <h3><?php echo number_format($total_mortality); ?></h3>
                    <p>Total Mortality</p>
                    <small style="color: <?php echo $avg_mortality_rate > 5 ? 'var(--danger)' : 'var(--success)'; ?>">
                        <?php echo $avg_mortality_rate; ?>% avg rate
                    </small>
                </div>
            </div>
            <div class="summary-card">
                <div class="card-icon">🔍</div>
                <div class="card-info">
                    <h3><?php echo number_format($total_missing); ?></h3>
                    <p>Missing Ducks</p>
                    <small style="color: <?php echo $avg_missing_rate > 3 ? 'var(--warning)' : 'var(--success)'; ?>">
                        <?php echo $avg_missing_rate; ?>% avg rate
                    </small>
                </div>
            </div>
            <div class="summary-card">
                <div class="card-icon">📉</div>
                <div class="card-info">
                    <h3><?php echo number_format($total_losses); ?></h3>
                    <p>Total Losses</p>
                    <small style="color: <?php echo $avg_total_loss_rate > 10 ? 'var(--danger)' : 'var(--warning)'; ?>">
                        <?php echo $avg_total_loss_rate; ?>% loss rate
                    </small>
                </div>
            </div>
        </div>

        <!-- Analytics Section -->
        <div class="analytics-grid">
            <div class="analytics-card">
                <h4>Breed Distribution</h4>
                <div class="chart-container" style="height: 250px;">
                    <canvas id="breedChart"></canvas>
                </div>
            </div>
            <div class="analytics-card">
                <h4>Age Distribution</h4>
                <div class="chart-container" style="height: 250px;">
                    <canvas id="ageChart"></canvas>
                </div>
            </div>
            <div class="analytics-card">
                <h4>Batch Status Overview</h4>
                <div class="status-stats">
                    <?php
                    $status_query = "SELECT status, COUNT(*) as count, SUM(current_count) as ducks 
                                    FROM duck_batches 
                                    WHERE farmer_id = ? 
                                    GROUP BY status 
                                    ORDER BY count DESC";
                    $stmt = $conn->prepare($status_query);
                    $stmt->bind_param("i", $user_id);
                    $stmt->execute();
                    $status_result = $stmt->get_result();
                    while($status = $status_result->fetch_assoc()):
                    ?>
                    <div class="status-stat-item">
                        <span class="status-badge <?php echo strtolower(str_replace(' ', '-', $status['status'])); ?>">
                            <?php echo $status['status']; ?>
                        </span>
                        <div class="status-numbers">
                            <strong><?php echo $status['count']; ?></strong> batches
                            <span>(<?php echo number_format($status['ducks']); ?> ducks)</span>
                        </div>
                    </div>
                    <?php endwhile; ?>
                </div>
            </div>
        </div>

        <!-- Filters -->
        <div class="filters-section">
            <div class="filter-group">
                <label for="statusFilter">Status:</label>
                <select id="statusFilter" onchange="filterBatches()">
                    <option value="">All Statuses</option>
                    <option value="Brooding">Brooding</option>
                    <option value="Growing">Growing</option>
                    <option value="Laying">Laying</option>
                    <option value="Peak Production">Peak Production</option>
                    <option value="Declining">Declining</option>
                    <option value="Retired">Retired</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="breedFilter">Breed:</label>
                <select id="breedFilter" onchange="filterBatches()">
                    <option value="">All Breeds</option>
                    <option value="Khaki Campbell">Khaki Campbell</option>
                    <option value="White Layer">White Layer</option>
                    <option value="Runner Duck">Runner Duck</option>
                    <option value="Pekin">Pekin</option>
                    <option value="Muscovy">Muscovy</option>
                    <option value="Native Pateros">Native Pateros</option>
                    <option value="Native Itik">Native Itik</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="ageFilter">Age Range:</label>
                <select id="ageFilter" onchange="filterBatches()">
                    <option value="">All Ages</option>
                    <option value="0-8">0-8 weeks (Young)</option>
                    <option value="9-16">9-16 weeks (Growing)</option>
                    <option value="17-30">17-30 weeks (Mature)</option>
                    <option value="31+">31+ weeks (Senior)</option>
                </select>
            </div>
            <button class="btn btn-secondary" onclick="clearFilters()">Clear Filters</button>
        </div>

        <!-- Batches Table - REMOVED SOLD COLUMN -->
        <div class="batches-section">
            <div class="table-container">
                <table class="batches-table" id="batchesTable">
                    <thead>
                        <tr>
                            <th>Batch Code</th>
                            <th>Name</th>
                            <th>Breed</th>
                            <th>Count</th>
                            <th>Age</th>
                            <th>Status</th>
                            <th>Location</th>
                            <th>Deaths</th>
                            <th>Missing</th>
                            <th>Total Loss</th>
                            <th>Started</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if ($batches_result->num_rows > 0): ?>
                            <?php while($batch = $batches_result->fetch_assoc()): 
                                $start_date = new DateTime($batch['start_date']);
                                $now = new DateTime();
                                $diff = $start_date->diff($now);
                                $age_weeks = floor($diff->days / 7);
                                $mortality_rate = $batch['initial_count'] > 0 ? round(($batch['mortality_count'] / $batch['initial_count']) * 100, 1) : 0;
                                $missing_count = $batch['missing_count'] ?? 0;
                                $missing_rate = $batch['initial_count'] > 0 ? round(($missing_count / $batch['initial_count']) * 100, 1) : 0;
                                $total_loss = $batch['mortality_count'] + $missing_count;
                                $total_loss_rate = $batch['initial_count'] > 0 ? round(($total_loss / $batch['initial_count']) * 100, 1) : 0;
                            ?>
                            <tr class="batch-row" 
                                data-batch-id="<?php echo $batch['batch_id']; ?>"
                                data-status="<?php echo $batch['status']; ?>"
                                data-breed="<?php echo $batch['breed']; ?>"
                                data-age="<?php echo $age_weeks; ?>">
                                <td><strong><?php echo htmlspecialchars($batch['batch_code']); ?></strong></td>
                                <td><?php echo htmlspecialchars($batch['batch_name']); ?></td>
                                <td><?php echo htmlspecialchars($batch['breed']); ?></td>
                                <td>
                                    <strong><?php echo number_format($batch['current_count']); ?></strong>
                                    <small style="color: var(--gray);">/<?php echo number_format($batch['initial_count']); ?></small>
                                </td>
                                <td><?php echo $age_weeks; ?>w</td>
                                <td>
                                    <span class="status-badge <?php echo strtolower(str_replace(' ', '-', $batch['status'])); ?>">
                                        <?php echo $batch['status']; ?>
                                    </span>
                                </td>
                                <td><?php echo htmlspecialchars($batch['location']); ?></td>
                                <td>
                                    <span class="loss-badge" style="color: <?php echo $mortality_rate > 5 ? 'var(--danger)' : 'var(--success)'; ?>">
                                        <?php echo number_format($batch['mortality_count']); ?> (<?php echo $mortality_rate; ?>%)
                                    </span>
                                </td>
                                <td>
                                    <span class="loss-badge" style="color: <?php echo $missing_rate > 3 ? 'var(--warning)' : 'var(--success)'; ?>">
                                        <?php echo number_format($missing_count); ?> (<?php echo $missing_rate; ?>%)
                                    </span>
                                </td>
                                <td>
                                    <span class="loss-badge" style="color: <?php echo $total_loss_rate > 10 ? 'var(--danger)' : ($total_loss_rate > 5 ? 'var(--warning)' : 'var(--success)'); ?>; font-weight: 700;">
                                        <?php echo number_format($total_loss); ?> (<?php echo $total_loss_rate; ?>%)
                                    </span>
                                </td>
                                <td><?php echo date('M d, Y', strtotime($batch['start_date'])); ?></td>
                                <td class="actions">
                                    <button class="btn-icon" onclick="window.batchModule.viewBatch(<?php echo $batch['batch_id']; ?>)" title="View Details">👁️</button>
                                    <button class="btn-icon" onclick="window.batchModule.editBatch(<?php echo $batch['batch_id']; ?>)" title="Edit">✏️</button>
                                    <button class="btn-icon" onclick="window.batchModule.moveBatch(<?php echo $batch['batch_id']; ?>)" title="Move Location">📍</button>
                                    <button class="btn-icon btn-warning" onclick="window.batchModule.viewLossHistory(<?php echo $batch['batch_id']; ?>)" title="View Loss History">📊</button>
                                    <button class="btn-icon btn-danger" onclick="window.batchModule.recordMortality(<?php echo $batch['batch_id']; ?>)" title="Record Loss">📉</button>
                                </td>
                            </tr>
                            <?php endwhile; ?>
                        <?php else: ?>
                            <tr>
                                <td colspan="12" style="text-align: center; padding: 2rem; color: var(--gray);">
                                    No batches found. Click "Add New Batch" to get started.
                                </td>
                            </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Quick Stats - UPDATED WITHOUT SOLD -->
        <div class="quick-stats">
            <h3>📈 Performance Metrics</h3>
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-label">Average Batch Age:</span>
                    <span class="stat-value">
                        <?php
                        $avg_query = "SELECT AVG(DATEDIFF(CURDATE(), start_date) / 7) as avg_age FROM duck_batches WHERE farmer_id = ? AND status != 'Retired'";
                        $stmt = $conn->prepare($avg_query);
                        $stmt->bind_param("i", $user_id);
                        $stmt->execute();
                        $avg_result = $stmt->get_result();
                        $avg_row = $avg_result->fetch_assoc();
                        echo round($avg_row['avg_age'] ?? 0);
                        ?> weeks
                    </span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Overall Survival Rate:</span>
                    <span class="stat-value">
                        <?php 
                        $total_query = "SELECT SUM(initial_count) as total FROM duck_batches WHERE farmer_id = ?";
                        $stmt = $conn->prepare($total_query);
                        $stmt->bind_param("i", $user_id);
                        $stmt->execute();
                        $total_result = $stmt->get_result();
                        $total_row = $total_result->fetch_assoc();
                        $initial_total = $total_row['total'] ?? 1;
                        $survival_rate = ($initial_total > 0) ? (($initial_total - $total_losses) / $initial_total) * 100 : 0;
                        echo number_format($survival_rate, 1);
                        ?>%
                    </span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Production Batches:</span>
                    <span class="stat-value">
                        <?php
                        $prod_query = "SELECT COUNT(*) as total FROM duck_batches WHERE farmer_id = ? AND status IN ('Laying', 'Peak Production')";
                        $stmt = $conn->prepare($prod_query);
                        $stmt->bind_param("i", $user_id);
                        $stmt->execute();
                        $prod_result = $stmt->get_result();
                        $prod_row = $prod_result->fetch_assoc();
                        echo $prod_row['total'];
                        ?> / <?php echo $active_batches; ?>
                    </span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Average Batch Size:</span>
                    <span class="stat-value">
                        <?php
                        $avg_size = $active_batches > 0 ? round($total_ducks / $active_batches) : 0;
                        echo number_format($avg_size);
                        ?> ducks
                    </span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Mortality Prevention:</span>
                    <span class="stat-value" style="color: <?php echo (100 - $avg_mortality_rate) > 95 ? 'var(--success)' : 'var(--warning)'; ?>">
                        <?php echo number_format(100 - $avg_mortality_rate, 1); ?>%
                    </span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Loss Prevention Rate:</span>
                    <span class="stat-value" style="color: <?php echo (100 - $avg_total_loss_rate) > 90 ? 'var(--success)' : 'var(--warning)'; ?>">
                        <?php echo number_format(100 - $avg_total_loss_rate, 1); ?>%
                    </span>
                </div>
            </div>
        </div>
    </div>

    <!-- Add Batch Modal -->
    <div id="addBatchModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Add New Duck Batch</h3>
                <button class="close" onclick="window.batchModule.closeModal('addBatchModal')">&times;</button>
            </div>
            <div class="modal-body">
                <form id="addBatchForm" onsubmit="window.batchModule.addBatch(event)">
                    <div class="form-group">
                        <label for="batchName">Batch Name: <span style="color: red;">*</span></label>
                        <input type="text" id="batchName" required placeholder="e.g., Fall Batch 2024">
                    </div>
                    <div class="form-group">
                        <label for="breed">Breed: <span style="color: red;">*</span></label>
                        <select id="breed" required>
                            <option value="">Select Breed</option>
                            <option value="Khaki Campbell">Khaki Campbell</option>
                            <option value="White Layer">White Layer</option>
                            <option value="Runner Duck">Runner Duck</option>
                            <option value="Pekin">Pekin</option>
                            <option value="Muscovy">Muscovy</option>
                            <option value="Native Pateros">Native Pateros</option>
                            <option value="Native Itik">Native Itik</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="initialCount">Initial Duck Count: <span style="color: red;">*</span></label>
                        <input type="number" id="initialCount" min="1" max="10000" required placeholder="e.g., 100">
                    </div>
                    <div class="form-group">
                        <label for="startDate">Start Date: <span style="color: red;">*</span></label>
                        <input type="date" id="startDate" required max="<?php echo date('Y-m-d'); ?>">
                    </div>
                    <div class="form-group">
                        <label for="location">Location: <span style="color: red;">*</span></label>
                        <select id="location" required>
                            <option value="">Select Location</option>
                            <option value="Brooder House 1">Brooder House 1</option>
                            <option value="Brooder House 2">Brooder House 2</option>
                            <option value="Pen A1">Pen A1</option>
                            <option value="Pen A2">Pen A2</option>
                            <option value="Pen B1">Pen B1</option>
                            <option value="Pen B2">Pen B2</option>
                            <option value="Pen C1">Pen C1</option>
                            <option value="Free Range Area 1">Free Range Area 1</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="notes">Notes (Optional):</label>
                        <textarea id="notes" rows="3" placeholder="Any special notes..."></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="window.batchModule.closeModal('addBatchModal')">Cancel</button>
                <button type="submit" form="addBatchForm" class="btn btn-primary">Add Batch</button>
            </div>
        </div>
    </div>

    <!-- Load Modular JS -->
    <script type="module" src="assets/js/batch/batch_main.js"></script>
    
    <script>
        // Charts and Filter Functions
        const breedData = <?php echo json_encode($breed_distribution); ?>;
        const breedLabels = breedData.map(b => b.breed);
        const breedCounts = breedData.map(b => parseInt(b.count));

        if (breedLabels.length > 0) {
            const breedCtx = document.getElementById('breedChart').getContext('2d');
            new Chart(breedCtx, {
                type: 'doughnut',
                data: {
                    labels: breedLabels,
                    datasets: [{
                        data: breedCounts,
                        backgroundColor: [
                            '#4a7c59',
                            '#5cb85c',
                            '#5bc0de',
                            '#f0ad4e',
                            '#d9534f',
                            '#9b59b6',
                            '#34495e'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                boxWidth: 12,
                                font: { size: 11 }
                            }
                        }
                    }
                }
            });
        }

        // Age Distribution Chart
        const ageData = {
            young: <?php echo $age_distribution['young'] ?? 0; ?>,
            growing: <?php echo $age_distribution['growing'] ?? 0; ?>,
            mature: <?php echo $age_distribution['mature'] ?? 0; ?>,
            senior: <?php echo $age_distribution['senior'] ?? 0; ?>
        };

        const ageCtx = document.getElementById('ageChart').getContext('2d');
        new Chart(ageCtx, {
            type: 'bar',
            data: {
                labels: ['Young\n(0-8w)', 'Growing\n(9-16w)', 'Mature\n(17-30w)', 'Senior\n(30+w)'],
                datasets: [{
                    label: 'Duck Count',
                    data: [ageData.young, ageData.growing, ageData.mature, ageData.senior],
                    backgroundColor: ['#4a7c59', '#5cb85c', '#f0ad4e', '#d9534f']
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
                            stepSize: 10
                        }
                    }
                }
            }
        });

        // Filter batches function
        function filterBatches() {
            const statusFilter = document.getElementById('statusFilter').value.toLowerCase();
            const breedFilter = document.getElementById('breedFilter').value.toLowerCase();
            const ageFilter = document.getElementById('ageFilter').value;
            
            const rows = document.querySelectorAll('.batch-row');
            
            rows.forEach(row => {
                const status = row.dataset.status.toLowerCase();
                const breed = row.dataset.breed.toLowerCase();
                const age = parseInt(row.dataset.age);
                
                let show = true;
                
                if (statusFilter && status !== statusFilter) show = false;
                if (breedFilter && breed !== breedFilter) show = false;
                
                if (ageFilter) {
                    const [min, max] = ageFilter.split('-');
                    if (max === '+') {
                        if (age <= parseInt(min)) show = false;
                    } else {
                        if (age < parseInt(min) || age > parseInt(max)) show = false;
                    }
                }
                
                row.style.display = show ? '' : 'none';
            });
        }

        // Clear filters
        function clearFilters() {
            document.getElementById('statusFilter').value = '';
            document.getElementById('breedFilter').value = '';
            document.getElementById('ageFilter').value = '';
            filterBatches();
        }

        // Search functionality
        document.getElementById('searchBatches').addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('.batch-row');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    </script>
</body>
</html>
<?php $conn->close(); ?>