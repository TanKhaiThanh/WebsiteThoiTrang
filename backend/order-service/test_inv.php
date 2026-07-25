<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$payload = [
    'product_id' => 1,
    'variant_id' => 1,
    'quantity' => 1,
    'price' => 100
];
$response = \Illuminate\Support\Facades\Http::withHeaders([
    'X-Session-ID' => 'session_12345'
])->post('http://localhost:8003/api/cart/items', $payload);

echo "STATUS: " . $response->status() . "\n";
echo "BODY: " . $response->body() . "\n";
