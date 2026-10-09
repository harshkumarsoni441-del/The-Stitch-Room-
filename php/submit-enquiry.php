<?php
header('Content-Type: application/json');
$file = __DIR__ . '/../data/contacts.json';

// Simulate email notification to admin (in a real app: mail('admin@thestitchroom.com', ...))
// Simulate Visitor confirmation email (in a real app: mail($email, ...))

$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$type = trim($_POST['type'] ?? 'General Enquiry');
$message = trim($_POST['message'] ?? '');

if (empty($name) || empty($phone)) {
    echo json_encode(['success' => false, 'message' => 'Name and Phone are required.']);
    exit;
}

$data = file_exists($file) ? json_decode(file_get_contents($file), true) : ['contacts' => []];
if (!isset($data['contacts'])) $data['contacts'] = [];

$maxId = 0; foreach ($data['contacts'] as $c) { if (($c['id'] ?? 0) > $maxId) $maxId = $c['id']; }

$newEnquiry = [
    'id' => $maxId + 1,
    'date' => date('Y-m-d'),
    'name' => $name,
    'email' => $email,
    'phone' => $phone,
    'school' => $type, // reusing field for categorization
    'subject' => "New $type Enquiry",
    'message' => $message,
    'status' => 'New'
];

array_unshift($data['contacts'], $newEnquiry); // add to top
file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));

echo json_encode([
    'success' => true,
    'message' => 'Thank you! Your enquiry has been received.',
    'whatsapp_link' => "https://wa.me/917812879053?text=" . urlencode("Hi, I just submitted an enquiry on your website regarding $type. My name is $name.")
]);
?>
