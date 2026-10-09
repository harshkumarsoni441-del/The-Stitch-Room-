<?php
require_once __DIR__ . '/admin-auth.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$username = trim($_POST['username'] ?? '');
$password = trim($_POST['password'] ?? '');

if (empty($username) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Username and password are required.']);
    exit();
}

$admin = require __DIR__ . '/admin-config.php';

$storedPassword = (string)($admin['password'] ?? '');
$passwordMatches = password_verify($password, $storedPassword);
if (preg_match('/^pbkdf2_sha256\$(\d+)\$([^$]+)\$([^$]+)$/', $storedPassword, $parts)) {
    $iterations = (int)$parts[1];
    $salt = base64_decode($parts[2], true);
    $expected = base64_decode($parts[3], true);
    if ($salt !== false && $expected !== false && $iterations >= 100000 && $iterations <= 1000000) {
        $actual = hash_pbkdf2('sha256', $password, $salt, $iterations, strlen($expected), true);
        $passwordMatches = hash_equals($expected, $actual);
    }
}
if ($username === ($admin['username'] ?? '') && $passwordMatches) {
    session_regenerate_id(true);
    $_SESSION['admin_logged_in'] = true;
    $_SESSION['admin_name']      = $admin['name'] ?? 'Admin';
    $_SESSION['admin_username']  = $admin['username'];
    $_SESSION['login_time']      = time();

    echo json_encode([
        'success' => true,
        'name'    => $admin['name'] ?? 'Admin',
        'message' => 'Login successful.'
    ]);
} else {
    // Rate limiting hint (basic)
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid username or password. Please try again.'
    ]);
}
?>
