<?php
session_start();
include 'includes/dbconnection.php';


if (isset($_POST['login'])) {
    $useremail = $_POST['useremail'];
    $password  = $_POST['password'];

    $sql = "SELECT id, fullname, password FROM farmer WHERE useremail = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $useremail);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows > 0) {
        $stmt->bind_result($id, $fullname, $hashed_password);
        $stmt->fetch();

        if (password_verify($password, $hashed_password)) {
            $_SESSION['user_id']   = $id;
            $_SESSION['fullname']  = $fullname;
            $_SESSION['useremail'] = $useremail;

            header("Location: dashboard.php");
            exit;
        } else {
            $error = "❌ Incorrect password!";
        }
    } else {
        $error = "❌ No account found with that email!";
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
  <title>AGRI-DUCK - Login</title>
  <!-- Google Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;500;700&display=swap" rel="stylesheet">
  <!-- Your Custom Styles -->
  <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
  <div class="split-container">

    <!-- Left side (Login Form) -->
    <div class="left-panel">
      <div class="brand">
        <img src="assets/images/logo.png" alt="Logo" class="logo">
        <h1 class="brand-text">AGRI-<span>DUCK</span></h1>
      </div>
      <p class="tagline">Native-Duck Farm Management • User Login</p>

      <?php if (!empty($error)) { echo "<p class='error-msg'>$error</p>"; } ?>

      <form method="post" action="index.php">
        <div class="form-group">
          <input type="email" name="useremail" placeholder="Email Address" required>
        </div>

        <div class="form-group">
          <input type="password" name="password" placeholder="Password" required>
        </div>

        <button type="submit" name="login" class="btn">Login</button>

        <p class="login-link">Don’t have an account? <a href="user_register.php">Register</a></p>
      </form>
    </div>

    <!-- Right side (Image) -->
    <div class="right-panel">
      <img src="assets/images/native_ducks.jpg" alt="Native Ducks">
      <div class="group-names">
        Developed by: Earl Justine Aquino • Florie Mae Dela Cruz • Aeron James Magallones
      </div>
    </div>
  </div>
</body>
</html>
