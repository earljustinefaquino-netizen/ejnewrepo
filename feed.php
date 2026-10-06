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

// Get feed inventory
$inventory_query = "SELECT * FROM feed_inventory WHERE farmer_id = ? ORDER BY purchase_date DESC";
$stmt = $conn->prepare($inventory_query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$inventory_result = $stmt->get_result();

// Calculate summary statistics
$summary_query = "SELECT 
    SUM(quantity_bags) as total_bags,
    SUM(total_cost) as total_value,
    SUM(CASE WHEN quantity_bags <= 5 AND quantity_bags > 0 THEN 1 ELSE 0 END) as low_stock,
    COUNT(DISTINCT feed_type) as feed_types
    FROM feed_inventory 
    WHERE farmer_id = ? AND quantity_bags > 0";
$stmt = $conn->prepare($summary_query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$summary = $result->fetch_assoc();

$total_bags = $summary['total_bags'] ?? 0;
$total_value = $summary['total_value'] ?? 0;
$low_stock_count = $summary['low_stock'] ?? 0;
$feed_types_count = $summary['feed_types'] ?? 0;

// Get feed types breakdown
$types_query = "SELECT feed_type, SUM(quantity_bags) as total 
                FROM feed_inventory 
                WHERE farmer_id = ? AND quantity_bags > 0 
                GROUP BY feed_type 
                ORDER BY total DESC";
$stmt = $conn->prepare($types_query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$types_result = $stmt->get_result();
$feed_types = [];
while ($row = $types_result->fetch_assoc()) {
    $feed_types[] = $row;
}

// Get low stock alerts
$low_stock_query = "SELECT * FROM feed_inventory 
                    WHERE farmer_id = ? AND quantity_bags > 0 AND quantity_bags <= 5 
                    ORDER BY quantity_bags ASC";
$stmt = $conn->prepare($low_stock_query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$low_stock_items = $stmt->get_result();
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
<link rel="stylesheet" href="assets/css/feed.css">
    
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
    <li><a href="feed.php" class="active">🌽 Feed Inventory</a></li>
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
                <img src="assets/images/logo1.png" alt="AgriDuck Logo" class="top-logo" onerror="this.style.display='none'">
                <h1>AGRI-<span>DUCK</span></h1>
            </div>
            <div class="right-header">
                <form class="search-form">
                    <input type="text" placeholder="Search feed..." id="searchFeed">
                </form>
                <a href="includes/logout.php" class="logout-btn">Logout</a>
            </div>
        </div>

        <!-- Page Header -->
        <div class="page-header">
            <h2>Feed Inventory Management</h2>
            <div class="header-actions">
                <button class="btn btn-primary" onclick="openAddFeedModal()">
                    ➕ Add Feed Purchase
                </button>
                <button class="btn btn-secondary" onclick="recordFeedUsage()">
                    📝 Record Usage
                </button>
            </div>
        </div>

        <!-- Low Stock Alerts -->
        <?php if ($low_stock_items->num_rows > 0): ?>
            <?php while($low_item = $low_stock_items->fetch_assoc()): ?>
            <div class="low-stock-alert">
                <div class="alert-icon">⚠️</div>
                <div class="alert-content">
                    <h4>Low Stock Warning</h4>
                    <p><?php echo htmlspecialchars($low_item['feed_type']); ?> 
                       <?php echo $low_item['feed_brand'] ? '(' . htmlspecialchars($low_item['feed_brand']) . ')' : ''; ?> 
                       - Only <?php echo $low_item['quantity_bags']; ?> bags remaining!</p>
                </div>
            </div>
            <?php endwhile; ?>
        <?php endif; ?>

        <!-- Summary Cards -->
        <div class="summary-cards">
            <div class="summary-card">
                <div class="card-icon">📦</div>
                <div class="card-info">
                    <h3><?php echo number_format($total_bags); ?></h3>
                    <p>Total Bags in Stock</p>
                </div>
            </div>
            <div class="summary-card">
                <div class="card-icon">💰</div>
                <div class="card-info">
                    <h3>₱<?php echo number_format($total_value, 2); ?></h3>
                    <p>Total Inventory Value</p>
                </div>
            </div>
            <div class="summary-card">
                <div class="card-icon">⚠️</div>
                <div class="card-info">
                    <h3><?php echo $low_stock_count; ?></h3>
                    <p>Low Stock Items</p>
                </div>
            </div>
            <div class="summary-card">
                <div class="card-icon">📊</div>
                <div class="card-info">
                    <h3><?php echo $feed_types_count; ?></h3>
                    <p>Feed Types</p>
                </div>
            </div>
        </div>
        <!-- Feed Types Breakdown -->
        <div class="feed-breakdown">
            <h3>Current Stock by Feed Type</h3>
            <div class="breakdown-grid">
                <?php if (!empty($feed_types)): ?>
                    <?php foreach($feed_types as $type): ?>
                        <div class="breakdown-item">
                            <div class="type-name"><?php echo htmlspecialchars($type['feed_type']); ?></div>
                            <div class="type-quantity"><?php echo number_format($type['total']); ?></div>
                            <div class="type-unit">bags</div>
                        </div>
                    <?php endforeach; ?>
                <?php else: ?>
                    <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--gray);">
                        No feed in stock. Start by recording your first purchase below.
                    </div>
                <?php endif; ?>
            </div>
        </div>

        <!-- Filters Section -->
        <div class="filters-section">
            <div class="filter-group">
                <label for="filterType">Feed Type:</label>
                <select id="filterType" onchange="filterInventory()">
                    <option value="">All Types</option>
                    <option value="Layer Feed">Layer Feed</option>
                    <option value="Grower Feed">Grower Feed</option>
                    <option value="Starter Feed">Starter Feed</option>
                    <option value="Breeder Feed">Breeder Feed</option>
                    <option value="Finisher Feed">Finisher Feed</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="filterStatus">Status:</label>
                <select id="filterStatus" onchange="filterInventory()">
                    <option value="">All Status</option>
                    <option value="available">Available</option>
                    <option value="low-stock">Low Stock</option>
                    <option value="out-of-stock">Out of Stock</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="filterDateFrom">Date From:</label>
                <input type="date" id="filterDateFrom" onchange="filterInventory()">
            </div>
            <div class="filter-group">
                <label for="filterDateTo">Date To:</label>
                <input type="date" id="filterDateTo" onchange="filterInventory()">
            </div>
            <button class="btn btn-secondary" onclick="clearFilters()" style="align-self: flex-end;">Clear Filters</button>
        </div>

        <!-- Feed Inventory Table -->
        <div class="feed-inventory-table">
            <h3>Feed Inventory Records</h3>
            <div class="table-container">
                <table class="feed-table">
                    <thead>
                        <tr>
                            <th>Purchase Date</th>
                            <th>Feed Type</th>
                            <th>Brand</th>
                            <th>Quantity</th>
                            <th>Weight/Bag</th>
                            <th>Cost/Bag</th>
                            <th>Total Cost</th>
                            <th>Supplier</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="inventoryTableBody">
                        <?php 
                        $stmt = $conn->prepare($inventory_query);
                        $stmt->bind_param("i", $user_id);
                        $stmt->execute();
                        $inventory_result = $stmt->get_result();
                        
                        if ($inventory_result->num_rows > 0): ?>
                            <?php while($feed = $inventory_result->fetch_assoc()): 
                                // Determine status based on quantity
                                $status_class = 'available';
                                $status_text = 'Available';
                                if ($feed['quantity_bags'] == 0) {
                                    $status_class = 'out-of-stock';
                                    $status_text = 'Out of Stock';
                                } elseif ($feed['quantity_bags'] <= 5) {
                                    $status_class = 'low-stock';
                                    $status_text = 'Low Stock';
                                }
                            ?>
                            <tr class="feed-row" data-type="<?php echo htmlspecialchars($feed['feed_type']); ?>" 
                                data-status="<?php echo $status_class; ?>" 
                                data-date="<?php echo $feed['purchase_date']; ?>">
                                <td><?php echo date('M d, Y', strtotime($feed['purchase_date'])); ?></td>
                                <td><strong><?php echo htmlspecialchars($feed['feed_type']); ?></strong></td>
                                <td>
                                    <?php if($feed['feed_brand']): ?>
                                        <span class="supplier-badge"><?php echo htmlspecialchars($feed['feed_brand']); ?></span>
                                    <?php else: ?>
                                        <span style="color: var(--gray);">N/A</span>
                                    <?php endif; ?>
                                </td>
                                <td><strong><?php echo number_format($feed['quantity_bags']); ?></strong> bags</td>
                                <td><?php echo number_format($feed['weight_per_bag'], 1); ?> kg</td>
                                <td>₱<?php echo number_format($feed['cost_per_bag'], 2); ?></td>
                                <td><strong>₱<?php echo number_format($feed['total_cost'], 2); ?></strong></td>
                                <td>
                                    <?php if($feed['supplier_name']): ?>
                                        <?php echo htmlspecialchars($feed['supplier_name']); ?>
                                        <?php if($feed['supplier_contact']): ?>
                                            <br><small style="color: var(--gray);"><?php echo htmlspecialchars($feed['supplier_contact']); ?></small>
                                        <?php endif; ?>
                                    <?php else: ?>
                                        <span style="color: var(--gray);">N/A</span>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <span class="status-badge <?php echo $status_class; ?>">
                                        <?php echo $status_text; ?>
                                    </span>
                                </td>
                                <td class="actions">
                                    <button class="btn-icon" onclick="editFeed(<?php echo $feed['feed_id']; ?>)" title="Edit">✏️</button>
                                    <button class="btn-icon" onclick="viewFeedDetails(<?php echo $feed['feed_id']; ?>)" title="View Details">👁️</button>
                                    <button class="btn-icon" onclick="deleteFeed(<?php echo $feed['feed_id']; ?>)" title="Delete">🗑️</button>
                                </td>
                            </tr>
                            <?php endwhile; ?>
                        <?php else: ?>
                            <tr>
                                <td colspan="10" style="text-align: center; padding: 2rem; color: var(--gray);">
                                    No feed inventory records found. Click "Add Feed Purchase" to get started.
                                </td>
                            </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Quick Stats -->
        <div class="quick-stats">
            <h3>Quick Statistics</h3>
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-label">Average Cost/Bag</span>
                    <span class="stat-value">₱<?php 
                        $avg_query = "SELECT AVG(cost_per_bag) as avg_cost FROM feed_inventory WHERE farmer_id = ? AND quantity_bags > 0";
                        $stmt = $conn->prepare($avg_query);
                        $stmt->bind_param("i", $user_id);
                        $stmt->execute();
                        $avg_result = $stmt->get_result()->fetch_assoc();
                        echo number_format($avg_result['avg_cost'] ?? 0, 2);
                    ?></span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Total Weight</span>
                    <span class="stat-value"><?php 
                        $weight_query = "SELECT SUM(quantity_bags * weight_per_bag) as total_weight FROM feed_inventory WHERE farmer_id = ? AND quantity_bags > 0";
                        $stmt = $conn->prepare($weight_query);
                        $stmt->bind_param("i", $user_id);
                        $stmt->execute();
                        $weight_result = $stmt->get_result()->fetch_assoc();
                        echo number_format($weight_result['total_weight'] ?? 0);
                    ?> kg</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Last Purchase</span>
                    <span class="stat-value"><?php 
                        $last_query = "SELECT MAX(purchase_date) as last_date FROM feed_inventory WHERE farmer_id = ?";
                        $stmt = $conn->prepare($last_query);
                        $stmt->bind_param("i", $user_id);
                        $stmt->execute();
                        $last_result = $stmt->get_result()->fetch_assoc();
                        echo $last_result['last_date'] ? date('M d', strtotime($last_result['last_date'])) : 'N/A';
                    ?></span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Active Suppliers</span>
                    <span class="stat-value"><?php 
                        $supplier_query = "SELECT COUNT(DISTINCT supplier_name) as supplier_count FROM feed_inventory WHERE farmer_id = ? AND supplier_name IS NOT NULL AND supplier_name != ''";
                        $stmt = $conn->prepare($supplier_query);
                        $stmt->bind_param("i", $user_id);
                        $stmt->execute();
                        $supplier_result = $stmt->get_result()->fetch_assoc();
                        echo $supplier_result['supplier_count'] ?? 0;
                    ?></span>
                </div>
            </div>
        </div>
    </div>

    <!-- Add Feed Modal -->
    <div id="addFeedModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Record Feed Purchase</h3>
                <button class="close" onclick="closeAddFeedModal()">&times;</button>
            </div>
            <div class="modal-body">
                <form id="feedPurchaseForm" onsubmit="addFeedPurchase(event)">
                    <div class="form-group">
                        <label for="purchaseDate">Purchase Date:</label>
                        <input type="date" id="purchaseDate" name="purchaseDate" required value="<?php echo date('Y-m-d'); ?>">
                    </div>
                    
                    <div class="form-group">
                        <label for="feedType">Feed Type:</label>
                        <select id="feedType" name="feedType" required>
                            <option value="">Select Feed Type</option>
                            <option value="Layer Feed">Layer Feed</option>
                            <option value="Grower Feed">Grower Feed</option>
                            <option value="Starter Feed">Starter Feed</option>
                            <option value="Breeder Feed">Breeder Feed</option>
                            <option value="Finisher Feed">Finisher Feed</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="feedBrand">Brand:</label>
                        <input type="text" id="feedBrand" name="feedBrand" placeholder="e.g., Vitarich, B-Meg">
                    </div>

                    <div class="form-group">
                        <label for="quantityBags">Number of Bags:</label>
                        <input type="number" id="quantityBags" name="quantityBags" min="1" required oninput="calculateTotal()">
                    </div>

                    <div class="form-group">
                        <label for="weightPerBag">Weight per Bag (kg):</label>
                        <input type="number" id="weightPerBag" name="weightPerBag" step="0.1" value="50" required>
                    </div>

                    <div class="form-group">
                        <label for="costPerBag">Cost per Bag (₱):</label>
                        <input type="number" id="costPerBag" name="costPerBag" step="0.01" required oninput="calculateTotal()">
                    </div>

                    <div class="form-group">
                        <label for="totalCost">Total Cost (₱):</label>
                        <input type="number" id="totalCost" name="totalCost" step="0.01" readonly style="background: var(--light-gray);">
                    </div>

                    <div class="form-group">
                        <label for="supplierName">Supplier Name:</label>
                        <input type="text" id="supplierName" name="supplierName" placeholder="Supplier name">
                    </div>

                    <div class="form-group">
                        <label for="supplierContact">Supplier Contact:</label>
                        <input type="text" id="supplierContact" name="supplierContact" placeholder="Phone/Email">
                    </div>

                    <div class="form-group">
                        <label for="expiryDate">Expiry Date (Optional):</label>
                        <input type="date" id="expiryDate" name="expiryDate">
                    </div>

         <div class="form-group">
  <label for="notes">Notes (Optional):</label>
  <textarea id="notes" name="notes" rows="3" placeholder="Any additional notes..."></textarea>
</div>


                </form>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="closeAddFeedModal()">Cancel</button>
                <button type="submit" form="feedPurchaseForm" class="btn btn-primary">Record Purchase</button>
            </div>
        </div>
    </div>

    <script src="assets/js/feed.js"></script>
<script>
    function calculateTotal() {
        const quantity = parseFloat(document.getElementById('quantityBags').value) || 0;
        const costPerBag = parseFloat(document.getElementById('costPerBag').value) || 0;
        const total = quantity * costPerBag;
        document.getElementById('totalCost').value = total.toFixed(2);
    }

    function openAddFeedModal() {
        document.getElementById('addFeedModal').style.display = 'flex';
    }

    function closeAddFeedModal() {
        document.getElementById('addFeedModal').style.display = 'none';
        document.getElementById('feedPurchaseForm').reset();
    }

    // REMOVED - already defined in feed.js as window.recordFeedUsage()

    function filterInventory() {
        const typeFilter = document.getElementById('filterType').value.toLowerCase();
        const statusFilter = document.getElementById('filterStatus').value;
        const dateFrom = document.getElementById('filterDateFrom').value;
        const dateTo = document.getElementById('filterDateTo').value;
        
        const rows = document.querySelectorAll('.feed-row');
        
        rows.forEach(row => {
            const type = row.dataset.type.toLowerCase();
            const status = row.dataset.status;
            const date = row.dataset.date;
            
            let show = true;
            
            if (typeFilter && !type.includes(typeFilter)) show = false;
            if (statusFilter && status !== statusFilter) show = false;
            if (dateFrom && date < dateFrom) show = false;
            if (dateTo && date > dateTo) show = false;
            
            row.style.display = show ? '' : 'none';
        });
    }

    function clearFilters() {
        document.getElementById('filterType').value = '';
        document.getElementById('filterStatus').value = '';
        document.getElementById('filterDateFrom').value = '';
        document.getElementById('filterDateTo').value = '';
        filterInventory();
    }

    // Close modal when clicking outside
    window.onclick = function(event) {
        const modal = document.getElementById('addFeedModal');
        if (event.target == modal) {
            closeAddFeedModal();
        }
    }
</script>
</body>
</html>
<?php $conn->close(); ?>