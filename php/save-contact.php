<?php
require_once __DIR__ . '/admin-auth.php';
require_admin();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$id     = (int)($_POST['id']     ?? 0);
$status = trim($_POST['status']  ?? 'read');

// Validate status value
$allowedStatuses = ['new', 'read', 'archived'];
if (!in_array($status, $allowedStatuses)) {
    echo json_encode(['success' => false, 'message' => 'Invalid status value.']);
    exit();
}

if ($id <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid contact ID.']);
    exit();
}

$file = __DIR__ . '/../data/contacts.json';

if (!file_exists($file)) {
    echo json_encode(['success' => false, 'message' => 'Contacts data file not found.']);
    exit();
}

$data = json_decode(file_get_contents($file), true);

if (!$data || !isset($data['contacts'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid contacts data format.']);
    exit();
}

// Find and update the contact
$found = false;
foreach ($data['contacts'] as &$contact) {
    if ((int)$contact['id'] === $id) {
        $contact['status'] = $status;
        $contact['updated_at'] = date('Y-m-d H:i:s');
        $found = true;
        break;
    }
}
unset($contact);

if (!$found) {
    echo json_encode(['success' => false, 'message' => "Contact with ID {$id} not found."]);
    exit();
}

$written = file_put_contents(
    $file,
    json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
);

if ($written === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to update contact.']);
    exit();
}

echo json_encode([
    'success' => true,
    'message' => "Contact status updated to '{$status}'.",
    'id'      => $id,
    'status'  => $status
]);
?>
