<?php
/**
 * Global Application Configuration
 * File: includes/config.php
 * 
 * This file contains application-wide settings and constants
 */

// Prevent direct access
if (!defined('APP_ACCESS')) {
    define('APP_ACCESS', true);
}

// ============================================
// APPLICATION SETTINGS
// ============================================
define('APP_NAME', 'AgriDuck Management System');
define('APP_VERSION', '1.0.0');
define('APP_URL', 'http://localhost/agriduck'); // Change in production
define('ADMIN_EMAIL', 'admin@agriduck.com');
define('SUPPORT_EMAIL', 'support@agriduck.com');

// ============================================
// ENVIRONMENT
// ============================================
define('ENVIRONMENT', 'development'); // development, staging, production
define('DEV_MODE', ENVIRONMENT === 'development');

// ============================================
// PATHS
// ============================================
define('BASE_PATH', dirname(__DIR__));
define('INCLUDES_PATH', BASE_PATH . '/includes');
define('UPLOAD_PATH', BASE_PATH . '/uploads');
define('LOG_PATH', BASE_PATH . '/logs');
define('ASSETS_PATH', BASE_PATH . '/assets');
define('ADMIN_PATH', BASE_PATH . '/admin');

// Create directories if they don't exist
$directories = [LOG_PATH, UPLOAD_PATH . '/profiles', UPLOAD_PATH . '/documents'];
foreach ($directories as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
}

// ============================================
// DATABASE CONFIGURATION
// ============================================
// Note: Your actual DB credentials should be in dbconnection.php
// These are just constants for reference
define('DB_HOST', 'localhost');
define('DB_NAME', 'agri_duck');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// ============================================
// SESSION CONFIGURATION
// ============================================
define('SESSION_LIFETIME', 3600); // 1 hour in seconds
define('SESSION_NAME', 'agriduck_session');

// Session security settings
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_lifetime', SESSION_LIFETIME);
ini_set('session.gc_maxlifetime', SESSION_LIFETIME);
ini_set('session.name', SESSION_NAME);

// Enable secure cookies only on HTTPS
if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
    ini_set('session.cookie_secure', 1);
}

// ============================================
// TIMEZONE
// ============================================
date_default_timezone_set('Asia/Manila');

// ============================================
// ERROR REPORTING
// ============================================
if (DEV_MODE) {
    // Development mode - show all errors
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
} else {
    // Production mode - log errors, don't display
    error_reporting(E_ALL);
    ini_set('display_errors', 0);
    ini_set('display_startup_errors', 0);
    ini_set('log_errors', 1);
    ini_set('error_log', LOG_PATH . '/php_errors.log');
}

// ============================================
// UPLOAD SETTINGS
// ============================================
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB
define('ALLOWED_IMAGE_TYPES', ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
define('ALLOWED_DOCUMENT_TYPES', ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);

// ============================================
// PAGINATION
// ============================================
define('DEFAULT_PAGE_SIZE', 20);
define('MAX_PAGE_SIZE', 100);

// ============================================
// SECURITY SETTINGS
// ============================================
define('PASSWORD_MIN_LENGTH', 8);
define('CSRF_TOKEN_LENGTH', 32);
define('BCRYPT_COST', 10);

// Rate limiting
define('RATE_LIMIT_ATTEMPTS', 5);
define('RATE_LIMIT_PERIOD', 300); // 5 minutes in seconds
define('RATE_LIMIT_LOCKOUT', 900); // 15 minutes in seconds

// ============================================
// EMAIL SETTINGS (Optional - for notifications)
// ============================================
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USER', 'your-email@gmail.com');
define('SMTP_PASS', 'your-app-password');
define('SMTP_FROM_NAME', APP_NAME);
define('SMTP_FROM_EMAIL', ADMIN_EMAIL);

// ============================================
// LOGGING
// ============================================
define('LOG_LEVEL', DEV_MODE ? 'DEBUG' : 'ERROR'); // DEBUG, INFO, WARNING, ERROR
define('LOG_RETENTION_DAYS', 90);
define('LOG_MAX_SIZE', 10 * 1024 * 1024); // 10MB

// ============================================
// CACHE SETTINGS
// ============================================
define('CACHE_ENABLED', !DEV_MODE);
define('CACHE_DURATION', 3600); // 1 hour

// ============================================
// API SETTINGS
// ============================================
define('API_RATE_LIMIT', 100); // Requests per hour
define('API_TIMEOUT', 30); // Seconds

// ============================================
// DATE & TIME FORMATS
// ============================================
define('DATE_FORMAT', 'Y-m-d');
define('TIME_FORMAT', 'H:i:s');
define('DATETIME_FORMAT', 'Y-m-d H:i:s');
define('DISPLAY_DATE_FORMAT', 'F d, Y');
define('DISPLAY_DATETIME_FORMAT', 'F d, Y h:i A');

// ============================================
// CURRENCY
// ============================================
define('CURRENCY_SYMBOL', '₱');
define('CURRENCY_CODE', 'PHP');
define('CURRENCY_DECIMALS', 2);

// ============================================
// BUSINESS RULES
// ============================================
define('MIN_DUCK_AGE_FOR_SALE', 60); // Days
define('EGG_COLLECTION_ALERT_THRESHOLD', 50); // Below this, show alert
define('LOW_FEED_ALERT_KG', 10); // Alert when feed below this amount

// ============================================
// MAINTENANCE MODE
// ============================================
define('MAINTENANCE_MODE', false);
define('MAINTENANCE_MESSAGE', 'System is currently under maintenance. Please check back later.');
define('MAINTENANCE_ALLOWED_IPS', ['127.0.0.1', '::1']); // IPs that can access during maintenance

// ============================================
// FEATURE FLAGS
// ============================================
define('FEATURE_EMAIL_NOTIFICATIONS', false);
define('FEATURE_SMS_NOTIFICATIONS', false);
define('FEATURE_EXPORT_PDF', true);
define('FEATURE_EXPORT_EXCEL', true);
define('FEATURE_BACKUP_AUTOMATION', false);
define('FEATURE_ANALYTICS', true);

// ============================================
// CUSTOM ERROR HANDLER (Optional)
// ============================================
if (!DEV_MODE) {
    set_error_handler(function($errno, $errstr, $errfile, $errline) {
        $log_message = sprintf(
            "[%s] Error %d: %s in %s on line %d\n",
            date('Y-m-d H:i:s'),
            $errno,
            $errstr,
            $errfile,
            $errline
        );
        error_log($log_message, 3, LOG_PATH . '/php_errors.log');
        
        // Don't execute PHP internal error handler
        return true;
    });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get application URL
 */
function app_url($path = '') {
    return APP_URL . '/' . ltrim($path, '/');
}

/**
 * Get asset URL
 */
function asset_url($path = '') {
    return APP_URL . '/assets/' . ltrim($path, '/');
}

/**
 * Check if in maintenance mode
 */
function is_maintenance_mode() {
    if (!MAINTENANCE_MODE) {
        return false;
    }
    
    $client_ip = $_SERVER['REMOTE_ADDR'] ?? '';
    return !in_array($client_ip, MAINTENANCE_ALLOWED_IPS);
}

/**
 * Log message to file
 */
function log_message($message, $level = 'INFO', $file = 'app.log') {
    $log_file = LOG_PATH . '/' . $file;
    $timestamp = date('Y-m-d H:i:s');
    $log_entry = "[$timestamp] [$level] $message\n";
    file_put_contents($log_file, $log_entry, FILE_APPEND);
}

/**
 * Debug helper (only works in development)
 */
function debug($data, $die = false) {
    if (DEV_MODE) {
        echo '<pre>';
        print_r($data);
        echo '</pre>';
        if ($die) die();
    }
}

// ============================================
// AUTO-LOAD REQUIRED FILES
// ============================================
if (file_exists(INCLUDES_PATH . '/dbconnection.php')) {
    require_once INCLUDES_PATH . '/dbconnection.php';
}

// ============================================
// MAINTENANCE MODE CHECK
// ============================================
if (is_maintenance_mode() && !defined('BYPASS_MAINTENANCE')) {
    http_response_code(503);
    die(MAINTENANCE_MESSAGE);
}