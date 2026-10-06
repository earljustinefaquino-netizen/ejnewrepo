<!-- FILE: sales.php - PERFECT VERSION -->
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

// Calculate statistics
$stats_query = "SELECT 
    SUM(total_amount) as total_sales,
    SUM(CASE WHEN sale_date = CURDATE() THEN total_amount ELSE 0 END) as today_sales,
    SUM(CASE WHEN YEARWEEK(sale_date) = YEARWEEK(CURDATE()) THEN total_amount ELSE 0 END) as week_sales,
    SUM(CASE WHEN MONTH(sale_date) = MONTH(CURDATE()) AND YEAR(sale_date) = YEAR(CURDATE()) THEN total_amount ELSE 0 END) as month_sales
    FROM sales 
    WHERE farmer_id = ?";
$stmt = $conn->prepare($stats_query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$stats = $result->fetch_assoc();
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
<link rel="stylesheet" href="assets/css/sales_fixed.css">
    
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Chart.js -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
</head>
<body>
    <!-- Loading Overlay -->
    <div class="loading-overlay" id="loadingOverlay">
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p><strong>Processing...</strong></p>
        </div>
    </div>

    <!-- Sidebar -->
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
            <li><a href="sales.php" class="active">💵 Sales</a></li>
            <li><a href="reports.php">📊 Reports</a></li>
            <li><a href="profile.php">👤 Profile/Settings</a></li>
        </ul>
    </div>

    <!-- Main Content -->
    <div class="main-content">
        <!-- Fixed Topbar -->
        <div class="topbar">
            <div class="left-header">
                <img src="assets/images/logo1.png" alt="AgriDuck Logo" class="top-logo" onerror="this.style.display='none'">
                <h1>AGRI-<span>DUCK</span></h1>
            </div>
            <div class="right-header">
                <a href="includes/logout.php" class="logout-btn">Logout</a>
            </div>
        </div>

        <!-- Alert Container -->
        <div id="alertContainer"></div>

        <!-- Page Header -->
        <div class="page-header">
            <h2>💰 Sales Management</h2>
            <div class="header-actions">
                <button class="btn btn-primary" onclick="scrollToForm()">
                    📝 Record Sale
                </button>
                <button class="btn btn-secondary" onclick="exportSales()">
                    📥 Export Report
                </button>
            </div>
        </div>

        <!-- Summary Cards -->
        <div class="summary-cards">
            <div class="summary-card">
                <div class="card-icon">₱</div>
                <div class="card-info">
                    <h3>₱<?php echo number_format($stats['today_sales'] ?? 0, 2); ?></h3>
                    <p>Today's Sales</p>
                </div>
            </div>
            <div class="summary-card">
                <div class="card-icon">📅</div>
                <div class="card-info">
                    <h3>₱<?php echo number_format($stats['week_sales'] ?? 0, 2); ?></h3>
                    <p>This Week</p>
                </div>
            </div>
            <div class="summary-card">
                <div class="card-icon">📊</div>
                <div class="card-info">
                    <h3>₱<?php echo number_format($stats['month_sales'] ?? 0, 2); ?></h3>
                    <p>This Month</p>
                </div>
            </div>
            <div class="summary-card">
                <div class="card-icon">💰</div>
                <div class="card-info">
                    <h3>₱<?php echo number_format($stats['total_sales'] ?? 0, 2); ?></h3>
                    <p>Total Sales</p>
                </div>
            </div>
        </div>

        <!-- Sales Form -->
        <div class="sales-form" id="salesForm">
            <h3>📝 Record New Sale</h3>
            <form id="recordSaleForm" onsubmit="recordSale(event)">
                <div class="form-row">
                    <div class="form-group">
                        <label for="saleDate">Sale Date: <span style="color: red;">*</span></label>
                        <input type="date" id="saleDate" required value="<?php echo date('Y-m-d'); ?>" max="<?php echo date('Y-m-d'); ?>">
                    </div>
                    <div class="form-group">
                        <label for="productType">Product Type: <span style="color: red;">*</span></label>
                        <select id="productType" required onchange="handleProductTypeChange()">
                            <option value="">Select Product</option>
                            <option value="Eggs">🥚 Eggs</option>
                            <option value="Ducks">🦆 Live Ducks</option>
                            <option value="Fertilizer">🌱 Duck Manure/Fertilizer</option>
                            <option value="Other">📦 Other</option>
                        </select>
                    </div>
                </div>

                <!-- Batch Selection (Shows for Ducks and Eggs) -->
                <div class="form-row" id="batchRow" style="display: none;">
                    <div class="form-group" style="flex: 2;">
                        <label for="batchId">Source Batch: <span style="color: red;">*</span></label>
                        <select id="batchId" name="batchId" onchange="updateAvailableCount()">
                            <option value="">Loading batches...</option>
                        </select>
                        <small style="color: #666; display: block; margin-top: 5px;" id="batchHint"></small>
                    </div>
                    <div class="form-group">
                        <label>Available:</label>
                        <input type="text" id="availableCount" readonly value="0" style="background: #f5f5f5; font-weight: bold;">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="quantity">Quantity: <span style="color: red;">*</span></label>
                        <input type="number" id="quantity" min="1" required oninput="calculateTotal()" placeholder="Enter quantity">
                    </div>
                    <div class="form-group">
                        <label for="unit">Unit:</label>
                        <select id="unit">
                            <option value="pieces">Pieces</option>
                            <option value="dozens">Dozens</option>
                            <option value="trays">Trays (30 pcs)</option>
                            <option value="kg">Kilograms</option>
                            <option value="heads">Heads (Ducks)</option>
                            <option value="sacks">Sacks</option>
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="unitPrice">Unit Price (₱): <span style="color: red;">*</span></label>
                        <input type="number" id="unitPrice" step="0.01" min="0" required oninput="calculateTotal()" placeholder="0.00">
                    </div>
                    <div class="form-group">
                        <label for="totalAmount">Total Amount (₱):</label>
                        <input type="number" id="totalAmount" step="0.01" readonly style="background: #f5f5f5; font-weight: bold; font-size: 1.1em;" value="0.00">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="customerName">Customer Name:</label>
                        <input type="text" id="customerName" placeholder="Customer name (optional)">
                    </div>
                    <div class="form-group">
                        <label for="customerContact">Contact Number:</label>
                        <input type="text" id="customerContact" placeholder="Phone/Email (optional)">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="paymentMethod">Payment Method:</label>
                        <select id="paymentMethod">
                            <option value="Cash">💵 Cash</option>
                            <option value="Bank Transfer">🏦 Bank Transfer</option>
                            <option value="GCash">📱 GCash</option>
                            <option value="Check">📄 Check</option>
                            <option value="Credit">📋 Credit/Terms</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="paymentStatus">Payment Status:</label>
                        <select id="paymentStatus">
                            <option value="Paid">✅ Paid</option>
                            <option value="Pending">⏳ Pending</option>
                            <option value="Partial">📊 Partial</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label for="saleNotes">Notes (Optional):</label>
                    <textarea id="saleNotes" rows="2" placeholder="Any additional notes about this sale..."></textarea>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary" id="submitBtn">✅ Record Sale</button>
                    <button type="button" class="btn btn-secondary" onclick="resetSaleForm()">🔄 Clear Form</button>
                </div>
            </form>
        </div>

        <!-- Filter Section -->
        <div class="filter-section">
            <h4>🔍 Filter Sales</h4>
            <div class="filter-row">
                <div class="filter-group">
                    <label for="filterSearch">Search:</label>
                    <input type="text" id="filterSearch" placeholder="Customer, product, batch...">
                </div>
                <div class="filter-group">
                    <label for="filterProduct">Product Type:</label>
                    <select id="filterProduct" onchange="loadSales()">
                        <option value="">All Products</option>
                        <option value="Eggs">Eggs</option>
                        <option value="Ducks">Ducks</option>
                        <option value="Fertilizer">Fertilizer</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label for="filterPayment">Payment Status:</label>
                    <select id="filterPayment" onchange="loadSales()">
                        <option value="">All Status</option>
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                        <option value="Partial">Partial</option>
                    </select>
                </div>
                <div class="filter-group">
                    <button class="btn btn-secondary" onclick="clearFilters()" style="width: 100%;">Clear Filters</button>
                </div>
            </div>
        </div>

        <!-- Sales History -->
        <div class="sales-history">
            <h3>📜 Sales History</h3>
            <div class="table-container">
                <table class="batches-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Product</th>
                            <th>Batch/Source</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                            <th>Customer</th>
                            <th>Payment</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="salesTableBody">
                        <tr>
                            <td colspan="10" style="text-align:center; padding:2rem; color:#999;">
                                <div class="spinner" style="margin: 0 auto 1rem;"></div>
                                Loading sales data...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div id="paginationContainer"></div>
        </div>
    </div>

    <!-- JavaScript -->
    <script src="assets/js/sale/sales.js"></script>
</body>
</html>