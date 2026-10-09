<?php
require_once __DIR__ . '/admin-auth.php';
require_admin();
header('Content-Type: application/json');
$file = __DIR__ . '/../data/products.json';
$id = (int)($_POST['id'] ?? 0);

if (!$id) { echo json_encode(['success'=>false]); exit; }
$data = file_exists($file) ? json_decode(file_get_contents($file), true) : ['products' => []];

$data['products'] = array_values(array_filter($data['products'], function($p) use ($id) { return $p['id'] != $id; }));
file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));
echo json_encode(['success'=>true]);
?>
