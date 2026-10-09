<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Sanitize inputs
$name    = trim(htmlspecialchars($_POST['name']    ?? '', ENT_QUOTES, 'UTF-8'));
$email   = trim(htmlspecialchars($_POST['email']   ?? '', ENT_QUOTES, 'UTF-8'));
$phone   = trim(htmlspecialchars($_POST['phone']   ?? '', ENT_QUOTES, 'UTF-8'));
$message = trim(htmlspecialchars($_POST['message'] ?? '', ENT_QUOTES, 'UTF-8'));
$subject = trim(htmlspecialchars($_POST['subject'] ?? '', ENT_QUOTES, 'UTF-8'));
$school  = trim(htmlspecialchars($_POST['school']  ?? '', ENT_QUOTES, 'UTF-8'));

// Validate required fields
if (empty($name) || empty($email) || empty($message)) {
    echo json_encode(['success' => false, 'message' => 'Name, email, and message are required.']);
    exit();
}

// Validate email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Please provide a valid email address.']);
    exit();
}

// Path to contacts JSON file
$file = __DIR__ . '/../data/contacts.json';

// Read existing contacts
if (!file_exists($file)) {
    $data = ['contacts' => []];
} else {
    $jsonContent = file_get_contents($file);
    $data = json_decode($jsonContent, true);
    if ($data === null || !isset($data['contacts'])) {
        $data = ['contacts' => []];
    }
}

// Determine next ID
$nextId = 1;
if (!empty($data['contacts'])) {
    $ids = array_column($data['contacts'], 'id');
    $nextId = max($ids) + 1;
}

// Build new contact entry
$newContact = [
    'id'        => $nextId,
    'name'      => $name,
    'email'     => $email,
    'phone'     => $phone,
    'school'    => $school,
    'subject'   => $subject,
    'message'   => $message,
    'timestamp' => date('Y-m-d H:i:s'),
    'status'    => 'new'
];

// Append to contacts array
$data['contacts'][] = $newContact;

// Write back to file
$written = file_put_contents(
    $file,
    json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
);

if ($written === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Could not save contact. Please try again.']);
    exit();
}

echo json_encode([
    'success' => true,
    'message' => 'Thank you, ' . $name . '! We have received your message and will get back to you within 24 hours.',
    'id'      => $nextId
]);
?>
