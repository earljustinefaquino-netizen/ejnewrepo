<?php
session_start();
require_once 'includes/dbconnection.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit;
}

$user_id = $_SESSION['user_id'];

// Fetch user data
$query = "SELECT * FROM farmer WHERE id = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

$message = '';
$error = '';

// Handle profile picture upload
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['upload_picture'])) {
    if (isset($_FILES['profile_picture']) && $_FILES['profile_picture']['error'] == 0) {
        $allowed = ['jpg', 'jpeg', 'png', 'gif'];
        $filename = $_FILES['profile_picture']['name'];
        $filetype = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        
        // Validate file type
        if (in_array($filetype, $allowed)) {
            // Validate file size (max 5MB)
            if ($_FILES['profile_picture']['size'] <= 5242880) {
                // Create uploads directory if it doesn't exist
                $upload_dir = 'assets/uploads/profiles/';
                if (!file_exists($upload_dir)) {
                    mkdir($upload_dir, 0777, true);
                }
                
                // Generate unique filename
                $new_filename = 'profile_' . $user_id . '_' . time() . '.' . $filetype;
                $upload_path = $upload_dir . $new_filename;
                
                // Move uploaded file
                if (move_uploaded_file($_FILES['profile_picture']['tmp_name'], $upload_path)) {
                    // Delete old profile picture if it exists and is not default
                    if (isset($user['profile_pic']) && $user['profile_pic'] != 'assets/images/default_user.png' && file_exists($user['profile_pic'])) {
                        unlink($user['profile_pic']);
                    }
                    
                    // Update database
                    $update_pic = "UPDATE farmer SET profile_pic = ? WHERE id = ?";
                    $stmt = $conn->prepare($update_pic);
                    $stmt->bind_param("si", $upload_path, $user_id);
                    
                    if ($stmt->execute()) {
                        $message = 'Profile picture updated successfully!';
                        // Refresh user data
                        $stmt = $conn->prepare($query);
                        $stmt->bind_param("i", $user_id);
                        $stmt->execute();
                        $result = $stmt->get_result();
                        $user = $result->fetch_assoc();
                    } else {
                        $error = 'Error updating profile picture in database.';
                    }
                } else {
                    $error = 'Error uploading file. Please try again.';
                }
            } else {
                $error = 'File size must be less than 5MB.';
            }
        } else {
            $error = 'Invalid file type. Only JPG, JPEG, PNG, and GIF are allowed.';
        }
    } else {
        $error = 'Please select a file to upload.';
    }
}

// Handle profile update
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['update_profile'])) {
    $fullname = trim($_POST['fullname']);
    $district = trim($_POST['district']);
    $municipality = trim($_POST['municipality']);
    $zipcode = trim($_POST['zipcode']);
    $useremail = trim($_POST['useremail']);
    
    $update_query = "UPDATE farmer SET fullname = ?, district = ?, municipality = ?, zipcode = ?, useremail = ? WHERE id = ?";
    $stmt = $conn->prepare($update_query);
    $stmt->bind_param("sssssi", $fullname, $district, $municipality, $zipcode, $useremail, $user_id);
    
    if ($stmt->execute()) {
        $_SESSION['fullname'] = $fullname;
        $message = 'Profile updated successfully!';
        // Refresh user data
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
    } else {
        $error = 'Error updating profile.';
    }
}

// Handle password change
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['change_password'])) {
    $current_password = $_POST['current_password'];
    $new_password = $_POST['new_password'];
    $confirm_password = $_POST['confirm_password'];
    
    // Verify current password
    $pass_query = "SELECT password FROM farmer WHERE id = ?";
    $stmt = $conn->prepare($pass_query);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $pass_data = $result->fetch_assoc();
    
    if (password_verify($current_password, $pass_data['password'])) {
        if ($new_password === $confirm_password) {
            if (strlen($new_password) >= 8) {
                $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
                $update_pass = "UPDATE farmer SET password = ? WHERE id = ?";
                $stmt = $conn->prepare($update_pass);
                $stmt->bind_param("si", $hashed_password, $user_id);
                
                if ($stmt->execute()) {
                    $message = 'Password changed successfully!';
                } else {
                    $error = 'Error changing password.';
                }
            } else {
                $error = 'Password must be at least 8 characters long.';
            }
        } else {
            $error = 'New passwords do not match.';
        }
    } else {
        $error = 'Current password is incorrect.';
    }
}

$fullname = $user['fullname'];
$profile_pic = isset($user['profile_pic']) ? $user['profile_pic'] : 'assets/images/default_user.png';
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
<link rel="stylesheet" href="assets/css/profile.css">
    
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
            <li><a href="feed.php">🌾 Feed Inventory</a></li>
            <li><a href="eggs.php">🥚 Egg Collection</a></li>
            <li><a href="sales.php">💰 Sales</a></li>
            <li><a href="reports.php">📈 Reports</a></li>
            <li><a href="profile.php" class="active">👤 Profile/Settings</a></li>
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

        <div class="page-header">
            <h2>Profile & Settings</h2>
        </div>

        <div class="profile-container">
            <?php if ($message): ?>
                <div class="alert alert-success">✓ <?php echo $message; ?></div>
            <?php endif; ?>
            
            <?php if ($error): ?>
                <div class="alert alert-error">✗ <?php echo $error; ?></div>
            <?php endif; ?>

            <!-- Profile Picture Upload -->
            <div class="profile-card">
                <h3>📸 Profile Picture</h3>
                <div class="profile-pic-upload">
                    <img src="<?php echo htmlspecialchars($profile_pic); ?>" alt="Profile Picture" class="profile-pic-preview" id="preview-image">
                    <form method="POST" action="" enctype="multipart/form-data">
                        <div class="form-group">
                            <label for="profile_picture">Choose a new profile picture:</label>
                            <input type="file" id="profile_picture" name="profile_picture" accept="image/jpeg,image/jpg,image/png,image/gif" onchange="previewImage(event)" required>
                            <small style="color: var(--gray); margin-top: 0.5rem; display: block;">
                                Allowed formats: JPG, JPEG, PNG, GIF. Max size: 5MB
                            </small>
                        </div>
                        <button type="submit" name="upload_picture" class="btn btn-primary">Upload Picture</button>
                    </form>
                </div>
            </div>

            <!-- Profile Information -->
            <div class="profile-card">
                <h3>📝 Personal Information</h3>
                <form method="POST" action="">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="fullname">Full Name:</label>
                            <input type="text" id="fullname" name="fullname" value="<?php echo htmlspecialchars($user['fullname']); ?>" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="useremail">Email Address:</label>
                            <input type="email" id="useremail" name="useremail" value="<?php echo htmlspecialchars($user['useremail']); ?>" required>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="district">District:</label>
                            <select id="district" name="district" required>
                                <option value="">Select District</option>
                                <?php for($i = 1; $i <= 6; $i++): ?>
                                    <option value="District <?php echo $i; ?>" <?php echo $user['district'] == "District $i" ? 'selected' : ''; ?>>
                                        District <?php echo $i; ?>
                                    </option>
                                <?php endfor; ?>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="municipality">Municipality:</label>
                            <input type="text" id="municipality" name="municipality" value="<?php echo htmlspecialchars($user['municipality']); ?>" required>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="zipcode">ZIP Code:</label>
                            <input type="text" id="zipcode" name="zipcode" value="<?php echo htmlspecialchars($user['zipcode']); ?>" required>
                        </div>
                    </div>

                    <button type="submit" name="update_profile" class="btn btn-primary">Update Profile</button>
                </form>
            </div>

            <!-- Change Password -->
            <div class="profile-card">
                <h3>🔒 Change Password</h3>
                <form method="POST" action="">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="current_password">Current Password:</label>
                            <input type="password" id="current_password" name="current_password" required>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="new_password">New Password:</label>
                            <input type="password" id="new_password" name="new_password" required minlength="8">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="confirm_password">Confirm New Password:</label>
                            <input type="password" id="confirm_password" name="confirm_password" required minlength="8">
                        </div>
                    </div>

                    <button type="submit" name="change_password" class="btn btn-primary">Change Password</button>
                </form>
            </div>

            <!-- Account Information -->
            <div class="profile-card">
                <h3>ℹ️ Account Information</h3>
                <div class="info-row">
                    <strong>Account Created:</strong> 
                    <span><?php echo date('F d, Y', strtotime($user['created_at'])); ?></span>
                </div>
                <div class="info-row">
                    <strong>User ID:</strong> 
                    <span><?php echo $user['id']; ?></span>
                </div>
                <div class="info-row">
                    <strong>Account Status:</strong> 
                    <span style="color: #28a745; font-weight: 600;">Active</span>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Preview image before upload
        function previewImage(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('preview-image').src = e.target.result;
                }
                reader.readAsDataURL(file);
            }
        }

        // Auto-hide alerts after 5 seconds
        setTimeout(function() {
            const alerts = document.querySelectorAll('.alert');
            alerts.forEach(function(alert) {
                alert.style.transition = 'opacity 0.5s ease';
                alert.style.opacity = '0';
                setTimeout(function() {
                    alert.remove();
                }, 500);
            });
        }, 5000);
    </script>
</body>
</html>
<?php $conn->close(); ?>