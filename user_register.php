<?php
include 'includes/dbconnection.php';
error_reporting(E_ALL);
ini_set('display_errors', 1);

if (isset($_POST['submit'])) {
    $fullname     = $_POST['fullname'];
    $district     = $_POST['district'];
    $municipality = $_POST['municipality'];
    $zipcode      = $_POST['zipcode'];
    $useremail    = $_POST['useremail'];
    $password     = $_POST['password'];
    $confirmpass  = $_POST['confirmpassword'];

    // 1. Confirm password match
    if ($password !== $confirmpass) {
        echo "❌ Passwords do not match!";
        exit;
    }

    // 2. Validate email format
    if (!filter_var($useremail, FILTER_VALIDATE_EMAIL)) {
        echo "❌ Invalid email format. Please include '@'.";
        exit;
    }

    // 3. Check if email already exists
    $check = $conn->prepare("SELECT id FROM farmer WHERE useremail = ?");
    $check->bind_param("s", $useremail);
    $check->execute();
    $check->store_result();

    if ($check->num_rows > 0) {
        echo "❌ Email already registered!";
        $check->close();
        exit;
    }
    $check->close();

    // 4. Validate password strength
    function validatePassword($password) {
        $errors = [];

        if (strlen($password) < 8) {
            $errors[] = "Password must be at least 8 characters long.";
        }
        if (!preg_match("/[A-Z]/", $password)) {
            $errors[] = "Password must contain at least one uppercase letter.";
        }
        if (!preg_match("/[a-z]/", $password)) {
            $errors[] = "Password must contain at least one lowercase letter.";
        }
        if (!preg_match("/[0-9]/", $password)) {
            $errors[] = "Password must contain at least one number.";
        }
        if (!preg_match("/[\W]/", $password)) {
            $errors[] = "Password must contain at least one special character.";
        }

        return $errors;
    }

    $passwordErrors = validatePassword($password);

    if (!empty($passwordErrors)) {
        foreach ($passwordErrors as $error) {
            echo "<p style='color:red;'>❌ $error</p>";
        }
        exit;
    }

    // 5. Hash the password
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    // 6. Insert into DB
    $stmt = $conn->prepare("INSERT INTO farmer (fullname, district, municipality, zipcode, useremail, password) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssss", $fullname, $district, $municipality, $zipcode, $useremail, $hashed_password);

    if ($stmt->execute()) {
        header("Location: index.php?registered=1");
        exit;
    } else {
        echo "❌ Error: " . $stmt->error;
    }

    $stmt->close();
    $conn->close();
}
?>



<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AGRI-DUCK - User Registration</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/css/style.css">
</head>
<script src="assets/js/script.js"></script>
<body>
  <div class="split-container">

    <!-- Left side (Form) -->
    <div class="left-panel">
      <div class="brand">
        <img src="assets/images/logo.png" alt="Logo" class="logo">
        <h1 class="brand-text">AGRI-<span>DUCK</span></h1>
      </div>
      <p class="tagline">Native-Duck Farm Management • User Registration</p>

      <form method="post" enctype="multipart/form-data" name="signup" onSubmit="return valid();">
        <div class="form-group">
          <input type="text" name="fullname" id="fullname" placeholder="Full Name" required>
        </div>

        <div class="form-group">
          <select name="district" id="district" onchange="loadMunicipalities()" required>
            <option value="">Select District</option>
            <option value="District 1">District 1</option>
            <option value="District 2">District 2</option>
            <option value="District 3">District 3</option>
            <option value="District 4">District 4</option>
            <option value="District 5">District 5</option>
            <option value="District 6">District 6</option>
          </select>
        </div>

        <div class="form-group">
          <select name="municipality" id="municipality" required>
            <option value="">Select Municipality</option>
          </select>
        </div>

        <div class="form-group">
          <input type="text" name="zipcode" id="zipcode" placeholder="ZIP Code" readonly required>
        </div>

        <div class="form-group">
          <input type="email" name="useremail" id="useremail" placeholder="User Email" required>
        </div>

        <div class="form-group">
          <input type="password" name="password" id="password" placeholder="Password" required>
        </div>

        <div class="form-group">
          <input type="password" name="confirmpassword" id="confirmpassword" placeholder="Confirm Password" required>
        </div>

        <div class="form-check">
          <label><input type="checkbox" required> I agree to all Terms & Conditions</label>
        </div>

        <button type="submit" name="submit" class="btn">Register</button>

        <p class="login-link">Already have an account? <a href="index.php">Login</a></p>
      </form>
    </div>

    <!-- Right side (Image) -->
    <div class="right-panel">
      <img src="assets/images/native_ducks.jpg" alt="Native Ducks">
      <div class="group-names">
    Developed by: Earl Justine Aquino • Florie Mae Dela Cruz • Aeron James Magallones
    </div>
    
  </div>

  
</body>
</html>