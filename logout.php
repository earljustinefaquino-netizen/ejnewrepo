<?php
session_start();

// remove all session data
session_unset();
session_destroy();

// redirect back to login page (index.php)
header("Location: ../index.php");
exit;
?>
