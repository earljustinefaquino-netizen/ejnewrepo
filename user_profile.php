<?php
/**
 * USER PROFILE HANDLER
 * Include this file at the top of your pages (dashboard.php, egg.php, feed.php, sales.php, etc.)
 * This ensures consistent profile picture and user data across all pages
 */

// Make sure session is started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit;
}

$user_id = $_SESSION['user_id'];

// Fetch latest user data from database
$query = "SELECT * FROM farmer WHERE id = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

// Check if user exists
if (!$user) {
    // User not found, logout
    session_destroy();
    header("Location: index.php");
    exit;
}

// Set profile picture with multiple fallback checks
if (!empty($user['profile_pic'])) {
    // Check if file exists
    if (file_exists($user['profile_pic'])) {
        $profile_pic = $user['profile_pic'];
    } else {
        // File doesn't exist, use default
        $profile_pic = 'assets/images/default_user.png';
    }
} else {
    // No profile pic set, use default
    $profile_pic = 'assets/images/default_user.png';
}

// Add cache busting parameter to force fresh image load
$profile_pic_url = $profile_pic . '?v=' . time();

// Get user's full name
$fullname = isset($user['fullname']) ? $user['fullname'] : 'User';

// Update session with latest data
$_SESSION['fullname'] = $fullname;
$_SESSION['profile_pic'] = $profile_pic;

// Optional: Get other user info
$useremail = isset($user['useremail']) ? $user['useremail'] : '';
$district = isset($user['district']) ? $user['district'] : '';
$municipality = isset($user['municipality']) ? $user['municipality'] : '';
$zipcode = isset($user['zipcode']) ? $user['zipcode'] : '';
?>