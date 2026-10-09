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

$id = (int)($_POST['id'] ?? 0);

if ($id <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid school ID.']);
    exit();
}

$file = __DIR__ . '/../data/schools.json';

if (!file_exists($file)) {
    echo json_encode(['success' => false, 'message' => 'Schools data file not found.']);
    exit();
}

$data = json_decode(file_get_contents($file), true);

if (!$data || !isset($data['schools'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid schools data format.']);
    exit();
}

// Find and remove the school
$originalCount = count($data['schools']);
$data['schools'] = array_values(array_filter(
    $data['schools'],
    fn($s) => (int)$s['id'] !== $id
));

if (count($data['schools']) === $originalCount) {
    echo json_encode(['success' => false, 'message' => "School with ID {$id} not found."]);
    exit();
}

$written = file_put_contents(
    $file,
    json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
);

if ($written === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to save changes.']);
    exit();
}

echo json_encode([
    'success' => true,
    'message' => 'School deleted successfully.',
    'deleted_id' => $id
]);
?>
