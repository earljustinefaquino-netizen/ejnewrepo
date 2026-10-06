<?php
/**
 * API Configuration & Helper Functions
 * File: includes/api_config.php
 * 
 * Provides helper functions and validation for API endpoints
 * Used by all API files in api/admin/
 */

// Prevent direct access
if (!defined('APP_ACCESS')) {
    define('APP_ACCESS', true);
}

// Load required files if not already loaded
if (!defined('APP_NAME')) {
    require_once __DIR__ . '/config.php';
}

if (!isset($conn)) {
    require_once __DIR__ . '/dbconnection.php';
}

if (!function_exists('checkAdminAuth')) {
    require_once __DIR__ . '/admin_auth.php';
}

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Set JSON header for all API responses
header('Content-Type: application/json');

// CORS headers (if needed for API access)
if (defined('ENABLE_CORS') && ENABLE_CORS) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
}

// Handle OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/**
 * Verify admin authentication
 */
function verifyAdminAuth() {
    if (!isset($_SESSION['admin_id']) || $_SESSION['role'] !== 'admin') {
        jsonResponse(false, 'Unauthorized access', null, 401);
    }
}

/**
 * Verify request method
 */
function verifyMethod($method = 'POST') {
    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        jsonResponse(false, 'Invalid request method', null, 405);
    }
}

/**
 * Verify CSRF token
 */
function verifyCSRF() {
    $token = $_POST['csrf_token'] ?? $_GET['csrf_token'] ?? '';
    
    if (empty($token) || !validateCSRF($token)) {
        jsonResponse(false, 'Invalid security token. Please refresh the page.', null, 403);
    }
}

/**
 * Get request parameter safely
 */
function getParam($key, $default = null, $sanitize = true) {
    $value = $_POST[$key] ?? $_GET[$key] ?? $default;
    
    if ($sanitize && is_string($value)) {
        return sanitizeInput($value);
    }
    
    return $value;
}

/**
 * Validate required parameters
 */
function validateRequired($params) {
    $missing = [];
    
    foreach ($params as $param) {
        if (!isset($_POST[$param]) && !isset($_GET[$param])) {
            $missing[] = $param;
        } elseif (empty(trim($_POST[$param] ?? $_GET[$param] ?? ''))) {
            $missing[] = $param;
        }
    }
    
    if (!empty($missing)) {
        jsonResponse(false, 'Missing required parameters: ' . implode(', ', $missing), null, 400);
    }
}

/**
 * Handle API errors gracefully
 */
function handleApiError($e, $action = 'operation') {
    // Log error
    logError("API Error in $action: " . $e->getMessage(), [
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ]);
    
    // Return user-friendly error
    $message = 'An error occurred while processing your request.';
    
    // In development, show detailed error
    if (defined('DEV_MODE') && DEV_MODE === true) {
        $message .= ' Error: ' . $e->getMessage();
    }
    
    jsonResponse(false, $message, null, 500);
}

/**
 * Wrap API endpoint execution with protection
 */
function executeApiEndpoint($callback, $requireAuth = true, $requireCSRF = true, $method = 'POST') {
    try {
        // Verify authentication
        if ($requireAuth) {
            verifyAdminAuth();
        }
        
        // Verify request method
        verifyMethod($method);
        
        // Verify CSRF token
        if ($requireCSRF && $method === 'POST') {
            verifyCSRF();
        }
        
        // Execute callback
        $callback();
        
    } catch (Exception $e) {
        handleApiError($e, debug_backtrace()[0]['file'] ?? 'unknown');
    }
}

/**
 * Pagination helper
 */
function paginate($query, $conn, $page = 1, $per_page = 20) {
    $page = max(1, intval($page));
    $per_page = min(100, max(1, intval($per_page)));
    $offset = ($page - 1) * $per_page;
    
    // Get total count
    $count_query = preg_replace('/SELECT .+ FROM/i', 'SELECT COUNT(*) as total FROM', $query);
    $count_query = preg_replace('/ORDER BY .+$/i', '', $count_query);
    $total = $conn->query($count_query)->fetch_assoc()['total'];
    
    // Add pagination to query
    $query .= " LIMIT $per_page OFFSET $offset";
    $result = $conn->query($query);
    $data = $result->fetch_all(MYSQLI_ASSOC);
    
    return [
        'data' => $data,
        'pagination' => [
            'page' => $page,
            'per_page' => $per_page,
            'total' => intval($total),
            'total_pages' => ceil($total / $per_page)
        ]
    ];
}

/**
 * Search helper - Build search query
 */
function buildSearchQuery($base_query, $search_term, $search_fields) {
    global $conn;
    
    if (empty($search_term)) {
        return $base_query;
    }
    
    $search_term = $conn->real_escape_string($search_term);
    $conditions = [];
    
    foreach ($search_fields as $field) {
        $conditions[] = "$field LIKE '%$search_term%'";
    }
    
    $search_condition = '(' . implode(' OR ', $conditions) . ')';
    
    if (stripos($base_query, 'WHERE') !== false) {
        return str_replace('WHERE', "WHERE $search_condition AND", $base_query);
    } else {
        $base_query .= " WHERE $search_condition";
    }
    
    return $base_query;
}

/**
 * Date range filter helper
 */
function addDateFilter($query, $date_field, $start_date = null, $end_date = null) {
    global $conn;
    
    $conditions = [];
    
    if ($start_date) {
        $start_date = $conn->real_escape_string($start_date);
        $conditions[] = "$date_field >= '$start_date'";
    }
    
    if ($end_date) {
        $end_date = $conn->real_escape_string($end_date);
        $conditions[] = "$date_field <= '$end_date'";
    }
    
    if (!empty($conditions)) {
        $filter = implode(' AND ', $conditions);
        
        if (stripos($query, 'WHERE') !== false) {
            $query = str_replace('WHERE', "WHERE $filter AND", $query);
        } else {
            $query .= " WHERE $filter";
        }
    }
    
    return $query;
}

/**
 * Filter by status helper
 */
function addStatusFilter($query, $status_field = 'status', $status = null) {
    global $conn;
    
    if (empty($status) || $status === 'all') {
        return $query;
    }
    
    $status = $conn->real_escape_string($status);
    $condition = "$status_field = '$status'";
    
    if (stripos($query, 'WHERE') !== false) {
        $query = str_replace('WHERE', "WHERE $condition AND", $query);
    } else {
        $query .= " WHERE $condition";
    }
    
    return $query;
}

/**
 * Validate email format
 */
function validateEmailFormat($email) {
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(false, 'Invalid email format', null, 400);
    }
    return true;
}

/**
 * Validate password strength
 */
function validatePasswordStrength($password, $min_length = 8) {
    if (strlen($password) < $min_length) {
        jsonResponse(false, "Password must be at least $min_length characters", null, 400);
    }
    return true;
}

/**
 * Validate integer value
 */
function validateInteger($value, $field_name) {
    if (!is_numeric($value) || intval($value) != $value) {
        jsonResponse(false, "$field_name must be a valid integer", null, 400);
    }
    return intval($value);
}

/**
 * Validate positive number
 */
function validatePositive($value, $field_name) {
    $value = validateInteger($value, $field_name);
    if ($value <= 0) {
        jsonResponse(false, "$field_name must be greater than zero", null, 400);
    }
    return $value;
}

/**
 * Rate limiting check
 */
function checkRateLimit($action, $limit = 100, $period = 3600) {
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
        jsonResponse(false, 'Rate limit exceeded. Please try again later.', null, 429);
    }
    
    // Increment counter
    $_SESSION[$key]['count']++;
    return true;
}

/**
 * Check if value exists in database
 */
function checkExists($conn, $table, $field, $value, $exclude_id = null) {
    $value = $conn->real_escape_string($value);
    $query = "SELECT id FROM $table WHERE $field = '$value'";
    
    if ($exclude_id) {
        $exclude_id = intval($exclude_id);
        $query .= " AND id != $exclude_id";
    }
    
    $result = $conn->query($query);
    return $result->num_rows > 0;
}

/**
 * Validate unique field
 */
function validateUnique($conn, $table, $field, $value, $exclude_id = null, $field_label = null) {
    if (checkExists($conn, $table, $field, $value, $exclude_id)) {
        $label = $field_label ?? ucfirst($field);
        jsonResponse(false, "$label already exists", null, 400);
    }
    return true;
}

/**
 * Success response helper
 */
function successResponse($message, $data = null) {
    jsonResponse(true, $message, $data, 200);
}

/**
 * Error response helper
 */
function errorResponse($message, $code = 400) {
    jsonResponse(false, $message, null, $code);
}

/**
 * Batch operation helper
 */
function batchOperation($conn, $callback, $items, &$success_count = 0, &$error_count = 0) {
    $errors = [];
    
    foreach ($items as $item) {
        try {
            $callback($conn, $item);
            $success_count++;
        } catch (Exception $e) {
            $error_count++;
            $errors[] = $e->getMessage();
        }
    }
    
    return [
        'success_count' => $success_count,
        'error_count' => $error_count,
        'errors' => $errors
    ];
}