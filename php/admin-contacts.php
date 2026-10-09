<?php
require_once __DIR__ . '/admin-auth.php';
require_admin();
$file = __DIR__ . '/../data/contacts.json';
$data = file_exists($file) ? json_decode(file_get_contents($file), true) : ['contacts' => []];
if (!is_array($data) || !isset($data['contacts']) || !is_array($data['contacts'])) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Contacts data is unavailable.']);
    exit;
}
echo json_encode(['contacts' => $data['contacts']], JSON_UNESCAPED_UNICODE);
