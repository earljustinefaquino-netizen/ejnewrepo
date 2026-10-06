<?php
session_start();

// Check if logged in
$fullname = isset($_SESSION['fullname']) ? $_SESSION['fullname'] : "NEW USER";
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Welcome - AGRI-DUCK</title>
<link rel="stylesheet" href="assets/css/welcome.css">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;500;700&display=swap" rel="stylesheet">
</head>
<body>

<!-- Navbar -->
<header class="navbar">
    <div class="logo">🦆 AGRI-DUCK</div>
    <nav>
        <a href="#home">Home</a>
        <a href="#about">About</a>
        <a href="#terms">Terms</a>
        <a href="includes/logout.php" class="logout-btn">Logout</a>
    </nav>
</header>

<!-- Hero / Home Section -->
<section class="hero" id="home">
    <div class="overlay"></div>
    <div class="welcome-card">
        <h1>Welcome, NEW USER</h1>
        <p>Manage your native-duck farm efficiently with AGRI-DUCK. Track breeding, inventory, and productivity in one place.</p>
        <a href="user_register.php" class="btn">Get Started</a>
    </div>
</section>

<!-- About Section -->
<section class="info-section" id="about">
    <div class="section-container">
        <h2>About AGRI-DUCK</h2>
        <p>AGRI-DUCK is a complete farm management platform designed for native-duck farmers. It helps track your farm operations, monitor health, and optimize productivity.</p>
        <div class="cards">
            <div class="card">
                <h3>Inventory Management</h3>
                <p>Keep track of feed, ducks, and farm resources with a simple interface.</p>
            </div>
            <div class="card">
                <h3>Breeding & Production</h3>
                <p>Monitor duck breeding, egg production, and growth rates to maximize efficiency.</p>
            </div>
            <div class="card">
                <h3>Reports & Analytics</h3>
                <p>Generate reports to understand your farm performance and plan improvements.</p>
            </div>
        </div>
    </div>
</section>

<!-- Terms Section -->
<section class="info-section terms-section" id="terms">
    <div class="section-container">
        <h2>Terms & Conditions</h2>
        <ul>
            <li>Users must provide valid information during registration.</li>
            <li>AGRI-DUCK stores data securely and only for farm management purposes.</li>
            <li>Users are responsible for farm activities and data accuracy.</li>
            <li>Unauthorized use or sharing of accounts is prohibited.</li>
        </ul>
    </div>
</section>

<!-- CTA Section -->
<section class="cta-section">
    <h2>Ready to get started?</h2>
    <a href="user_register.php" class="btn">Register Now</a>
</section>

<!-- Footer -->
<footer>
    Developed by: Earl Justine Aquino • Florie Mae Dela Cruz • Aeron James Magallones
</footer>

</body>
</html>
