<?php
/**
 * Profile Picture Helper Functions
 * File: includes/profile_helper.php
 * 
 * Usage: require_once '../includes/profile_helper.php';
 */

/**
 * Get the correct profile picture path
 * Handles different path formats and provides fallback
 * 
 * @param string|null $db_path The path stored in database
 * @param string $base_path Base path for relative URLs (default: '../')
 * @return string The correct profile picture path
 */
function get_profile_picture_path($db_path, $base_path = '../') {
    $default = $base_path . 'assets/images/default-avatar.png';
    
    // If no path provided, return default
    if (empty($db_path)) {
        return $default;
    }
    
    // Remove any default avatar references
    if (strpos($db_path, 'default-avatar.png') !== false || 
        strpos($db_path, 'default_user.png') !== false) {
        return $default;
    }
    
    // Determine the full path
    $test_path = null;
    
    if (strpos($db_path, 'uploads/') === 0) {
        // New format: uploads/profiles/xxx.jpg
        $test_path = $base_path . $db_path;
    } elseif (strpos($db_path, 'assets/uploads/') === 0) {
        // Old format: assets/uploads/profiles/xxx.jpg
        $test_path = $base_path . $db_path;
    } elseif (strpos($db_path, '../') === 0) {
        // Already has ../
        $test_path = $db_path;
    } elseif (strpos($db_path, 'http://') === 0 || strpos($db_path, 'https://') === 0) {
        // External URL
        return $db_path;
    } else {
        // Unknown format, try as relative
        $test_path = $base_path . $db_path;
    }
    
    // Check if file exists
    if ($test_path && file_exists($test_path)) {
        return $test_path;
    }
    
    // If file doesn't exist, return default
    return $default;
}

/**
 * Get profile picture URL for use in HTML img src
 * 
 * @param string|null $db_path The path stored in database
 * @return string The URL path for img src
 */
function get_profile_picture_url($db_path) {
    $default = '../assets/images/default-avatar.png';
    
    if (empty($db_path)) {
        return $default;
    }
    
    // Remove any default avatar references
    if (strpos($db_path, 'default-avatar.png') !== false || 
        strpos($db_path, 'default_user.png') !== false) {
        return $default;
    }
    
    // Build URL path
    if (strpos($db_path, 'uploads/') === 0) {
        return '../' . $db_path;
    } elseif (strpos($db_path, 'assets/uploads/') === 0) {
        return '../' . $db_path;
    } elseif (strpos($db_path, 'http://') === 0 || strpos($db_path, 'https://') === 0) {
        return $db_path;
    }
    
    return $default;
}

/**
 * Delete old profile picture file
 * 
 * @param string|null $file_path The path to delete
 * @return bool Success status
 */
function delete_old_profile_picture($file_path) {
    if (empty($file_path)) {
        return false;
    }
    
    // Don't delete default images
    if (strpos($file_path, 'default') !== false) {
        return false;
    }
    
    // Build full path
    $full_path = null;
    if (strpos($file_path, '../') === 0) {
        $full_path = $file_path;
    } else {
        $full_path = '../' . $file_path;
    }
    
    // Delete if exists
    if (file_exists($full_path)) {
        return @unlink($full_path);
    }
    
    return false;
}

/**
 * Validate uploaded image file
 * 
 * @param array $file The $_FILES array element
 * @return array ['success' => bool, 'message' => string]
 */
function validate_profile_picture($file) {
    // Check for upload errors
    if ($file['error'] !== UPLOAD_ERR_OK) {
        return ['success' => false, 'message' => 'File upload error'];
    }
    
    // Check file size (2MB max)
    if ($file['size'] > 2097152) {
        return ['success' => false, 'message' => 'File size too large. Maximum 2MB allowed'];
    }
    
    // Check file type
    $allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime_type = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($mime_type, $allowed_types)) {
        return ['success' => false, 'message' => 'Invalid file type. Only JPG, PNG, and GIF allowed'];
    }
    
    // Check if it's actually an image
    if (!getimagesize($file['tmp_name'])) {
        return ['success' => false, 'message' => 'File is not a valid image'];
    }
    
    return ['success' => true, 'message' => 'Validation passed'];
}

/**
 * Save uploaded profile picture
 * 
 * @param array $file The $_FILES array element
 * @param int $user_id The user ID
 * @param string|null $old_path Old profile picture path to delete
 * @return array ['success' => bool, 'message' => string, 'path' => string|null]
 */
function save_profile_picture($file, $user_id, $old_path = null) {
    // Validate file
    $validation = validate_profile_picture($file);
    if (!$validation['success']) {
        return $validation;
    }
    
    // Create upload directory if it doesn't exist
    $upload_dir = '../uploads/profiles/';
    if (!file_exists($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }
    
    // Generate unique filename
    $file_ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $new_filename = 'profile_' . $user_id . '_' . time() . '.' . $file_ext;
    $upload_path = $upload_dir . $new_filename;
    $db_path = 'uploads/profiles/' . $new_filename;
    
    // Delete old file
    if ($old_path) {
        delete_old_profile_picture($old_path);
    }
    
    // Move uploaded file
    if (move_uploaded_file($file['tmp_name'], $upload_path)) {
        // Set proper permissions
        chmod($upload_path, 0644);
        
        return [
            'success' => true,
            'message' => 'Profile picture uploaded successfully',
            'path' => $db_path
        ];
    }
    
    return [
        'success' => false,
        'message' => 'Failed to save uploaded file'
    ];
}

/**
 * Get avatar initials from name
 * For displaying when no profile picture is available
 * 
 * @param string $name Full name
 * @return string Initials (max 2 characters)
 */
function get_avatar_initials($name) {
    $words = explode(' ', trim($name));
    $initials = '';
    
    foreach ($words as $word) {
        if (strlen($initials) >= 2) break;
        if (!empty($word)) {
            $initials .= strtoupper(substr($word, 0, 1));
        }
    }
    
    return $initials ?: 'U';
}
?>