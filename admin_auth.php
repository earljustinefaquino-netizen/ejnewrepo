<?php
/**
 * Admin Authentication Helper
 * File: includes/admin_auth.php
 * 
 * Provides authentication and utility functions for admin panel
 */

/**
 * Check if admin is authenticated
 * Redirects to login if not authenticated
 */
function checkAdminAuth() {
    if (!isset($_SESSION['admin_id']) || $_SESSION['role'] !== 'admin') {
        header('Location: ../admin/login.php');
        exit();
    }
}

/**
 * Get current admin data
 */
function getCurrentAdmin($conn) {
    if (!isset($_SESSION['admin_id'])) {
        return null;
    }
    
    $admin_id = $_SESSION['admin_id'];
    $stmt = $conn->prepare("SELECT id, username, fullname, role, last_login FROM admin WHERE id = ?");
    $stmt->bind_param("i", $admin_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    return $result->fetch_assoc();
}

/**
 * Generate CSRF token
 */
function generateCSRF() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * Validate CSRF token
 */
function validateCSRF($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * Log admin activity
 */
function logAdminActivity($conn, $action, $description, $target_user_id = null) {
    if (!isset($_SESSION['admin_id'])) {
        return false;
    }
    
    $admin_id = $_SESSION['admin_id'];
    $ip_address = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    
    $stmt = $conn->prepare("
        INSERT INTO admin_activity_logs 
        (admin_id, action, description, target_user_id, ip_address, user_agent, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, NOW())
    ");
    $stmt->bind_param("ississ", $admin_id, $action, $description, $target_user_id, $ip_address, $user_agent);
    
    return $stmt->execute();
}

/**
 * Sanitize input
 */
function sanitizeInput($input) {
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

/**
 * Validate email
 */
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

/**
 * JSON response helper
 */
function jsonResponse($success, $message, $data = null, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    exit();
}

/**
 * Log error to file
 */
function logError($message, $context = []) {
    $log_dir = __DIR__ . '/../logs';
    if (!is_dir($log_dir)) {
        mkdir($log_dir, 0755, true);
    }
    
    $log_file = $log_dir . '/admin_errors_' . date('Y-m-d') . '.log';
    $log_entry = date('Y-m-d H:i:s') . ' - ' . $message;
    
    if (!empty($context)) {
        $log_entry .= ' | Context: ' . json_encode($context);
    }
    
    $log_entry .= PHP_EOL;
    
    file_put_contents($log_file, $log_entry, FILE_APPEND);
}

/**
 * Check if user has specific permission
 */
function hasPermission($permission) {
    // For now, all admins have all permissions
    // You can expand this later with role-based permissions
    return isset($_SESSION['role']) && $_SESSION['role'] === 'admin';
}

/**
 * Format date for display
 */
function formatDate($date, $format = 'M d, Y h:i A') {
    if (empty($date)) return 'N/A';
    return date($format, strtotime($date));
}

/**
 * Format currency
 */
function formatCurrency($amount) {
    return '₱' . number_format($amount, 2);
}

/**
 * Generate random password
 */
function generatePassword($length = 12) {
    $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    $password = '';
    $charLength = strlen($chars);
    
    for ($i = 0; $i < $length; $i++) {
        $password .= $chars[random_int(0, $charLength - 1)];
    }
    
    return $password;
}

/**
 * Send email notification
 */
function sendEmailNotification($to, $subject, $message) {
    // Implement your email sending logic here
    // You can use PHPMailer or similar library
    
    $headers = "From: AgriDuck System <noreply@agriduck.com>\r\n";
    $headers .= "Reply-To: noreply@agriduck.com\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    
    return mail($to, $subject, $message, $headers);
}

/**
 * Validate password strength
 */
function validatePasswordStrength($password) {
    $errors = [];
    
    if (strlen($password) < 8) {
        $errors[] = 'Password must be at least 8 characters long';
    }
    
    if (!preg_match('/[A-Z]/', $password)) {
        $errors[] = 'Password must contain at least one uppercase letter';
    }
    
    if (!preg_match('/[a-z]/', $password)) {
        $errors[] = 'Password must contain at least one lowercase letter';
    }
    
    if (!preg_match('/[0-9]/', $password)) {
        $errors[] = 'Password must contain at least one number';
    }
    
    return empty($errors) ? true : $errors;
}

/**
 * Rate limiting helper
 */
function checkRateLimit($action, $limit = 10, $period = 60) {
    $key = 'rate_limit_' . $action . '_' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    
    if (!isset($_SESSION[$key])) {
        $_SESSION[$key] = ['count' => 0, 'start' => time()];
    }
    
    $rate_data = $_SESSION[$key];
    
    // Reset if period has passed
    if (time() - $rate_data['start'] > $period) {
        $_SESSION[$key] = ['count' => 1, 'start' => time()];
        return true;
    }
    
    // Check limit
    if ($rate_data['count'] >= $limit) {
        return false;
    }
    
    // Increment counter
    $_SESSION[$key]['count']++;
    return true;
}

/**
 * Get user activity summary
 */
function getUserActivitySummary($conn, $user_id, $days = 30) {
    $stmt = $conn->prepare("
        SELECT 
            activity_type,
            COUNT(*) as count,
            MAX(created_at) as last_activity
        FROM activity_logs
        WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY activity_type
        ORDER BY count DESC
    ");
    $stmt->bind_param("ii", $user_id, $days);
    $stmt->execute();
    
    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
}

/**
 * Export data to CSV
 */
function exportToCSV($filename, $data, $headers = []) {
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    
    $output = fopen('php://output', 'w');
    
    // Write headers
    if (!empty($headers)) {
        fputcsv($output, $headers);
    } else if (!empty($data)) {
        fputcsv($output, array_keys($data[0]));
    }
    
    // Write data
    foreach ($data as $row) {
        fputcsv($output, $row);
    }
    
    fclose($output);
    exit();
}

/**
 * Clean old logs
 */
function cleanOldLogs($days = 90) {
    $log_dir = __DIR__ . '/../logs';
    if (!is_dir($log_dir)) return;
    
    $cutoff_date = date('Y-m-d', strtotime("-$days days"));
    $files = glob($log_dir . '/*.log');
    
    foreach ($files as $file) {
        if (preg_match('/_(\d{4}-\d{2}-\d{2})\.log$/', $file, $matches)) {
            if ($matches[1] < $cutoff_date) {
                unlink($file);
            }
        }
    }
}