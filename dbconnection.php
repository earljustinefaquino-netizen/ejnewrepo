<?php
$servername = "localhost";
$username   = "root";   // default in XAMPP
$password   = "";       // default in XAMPP is empty
$database   = "agri_duck";   // <-- replace with your actual database name

// Create connection
$conn = new mysqli($servername, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>
