<?php
// Keep credentials out of public JSON files. Set the password hash in this
configuration when deploying; the current hash uses PBKDF2-SHA256 (310k rounds).
return [
    'username' => 'admin',
    'password' => 'pbkdf2_sha256$310000$TACHa1zEblJ9ZTLtKbqYzQ==$a1wEUK+Gu1NtWNHXikR3W5jVldIpkAbPUquxEkHIveI=',
    'name' => 'The Stitch Room Admin'
];
