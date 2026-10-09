<?php
require_once __DIR__ . '/admin-auth.php';
require_admin();
header('Content-Type: application/json');
$file = __DIR__ . '/../data/products.json';
$action = trim($_POST['action'] ?? 'add');
$prodJson = trim($_POST['product'] ?? '');

if (empty($prodJson)) { echo json_encode(['success'=>false, 'message'=>'No data']); exit; }
$product = json_decode($prodJson, true);
if (!$product || empty($product['name'])) { echo json_encode(['success'=>false, 'message'=>'Invalid data']); exit; }

$data = file_exists($file) ? json_decode(file_get_contents($file), true) : ['products' => []];
if (!isset($data['products'])) $data['products'] = [];

if ($action === 'update' && !empty($product['id'])) {
    foreach ($data['products'] as &$p) {
        if ($p['id'] == $product['id']) { $product['id'] = (int)$product['id']; $p = $product; break; }
    }
} else {
    $maxId = 0; foreach ($data['products'] as $p) { if ($p['id'] > $maxId) $maxId = $p['id']; }
    $product['id'] = $maxId + 1;
    $data['products'][] = $product;
}

file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));
echo json_encode(['success'=>true]);
?>
