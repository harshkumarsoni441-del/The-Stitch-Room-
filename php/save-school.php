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

$action     = trim($_POST['action'] ?? 'add');
$schoolJson = trim($_POST['school'] ?? '');

if (empty($schoolJson)) {
    echo json_encode(['success' => false, 'message' => 'No school data provided.']);
    exit();
}

$school = json_decode($schoolJson, true);
if ($school === null) {
    echo json_encode(['success' => false, 'message' => 'Invalid school data format.']);
    exit();
}

// Sanitize school data
$school['name']        = htmlspecialchars($school['name']        ?? '', ENT_QUOTES, 'UTF-8');
$school['city']        = htmlspecialchars($school['city']        ?? '', ENT_QUOTES, 'UTF-8');
$school['address']     = htmlspecialchars($school['address']     ?? '', ENT_QUOTES, 'UTF-8');
$school['email']       = htmlspecialchars($school['email']       ?? '', ENT_QUOTES, 'UTF-8');
$school['phone']       = htmlspecialchars($school['phone']       ?? '', ENT_QUOTES, 'UTF-8');
$school['logo']        = htmlspecialchars($school['logo']        ?? '', ENT_QUOTES, 'UTF-8');
$school['color']       = htmlspecialchars($school['color']       ?? '#0f172a', ENT_QUOTES, 'UTF-8');
$school['status']      = htmlspecialchars($school['status']      ?? 'Active', ENT_QUOTES, 'UTF-8');
$school['categories']  = htmlspecialchars($school['categories']  ?? '', ENT_QUOTES, 'UTF-8');
$school['catalogue']   = htmlspecialchars($school['catalogue']   ?? '', ENT_QUOTES, 'UTF-8');
$school['config3d']    = htmlspecialchars($school['config3d']    ?? '', ENT_QUOTES, 'UTF-8');

// Validate required fields
if (empty($school['name']) || empty($school['city'])) {
    echo json_encode(['success' => false, 'message' => 'School name and city are required.']);
    exit();
}

// Read schools JSON
$file = __DIR__ . '/../data/schools.json';

if (!file_exists($file)) {
    $data = ['schools' => []];
} else {
    $data = json_decode(file_get_contents($file), true) ?? ['schools' => []];
}

if ($action === 'update' && !empty($school['id'])) {
    // Update existing school
    $updated = false;
    foreach ($data['schools'] as &$s) {
        if ($s['id'] === (int)$school['id']) {
            $school['id']    = (int)$school['id'];
            
            $s = $school;
            $updated = true;
            break;
        }
    }
    unset($s);

    if (!$updated) {
        echo json_encode(['success' => false, 'message' => 'School not found for update.']);
        exit();
    }
} else {
    // Add new school
    // Determine next ID
    $maxId = 0;
    foreach ($data['schools'] as $s) {
        if ($s['id'] > $maxId) $maxId = $s['id'];
    }
    $school['id']    = $maxId + 1;
    
    $data['schools'][] = $school;
}

// Write back to file
$written = file_put_contents(
    $file,
    json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
);

if ($written === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to save school data.']);
    exit();
}

echo json_encode([
    'success' => true,
    'message' => $action === 'update' ? 'School updated successfully.' : 'School added successfully.',
    'school'  => $school
]);
?>

