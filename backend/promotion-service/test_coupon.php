<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$coupon = \App\Models\Coupon::where('code', 'AUTUMN2026')->first();
if (!$coupon) {
    echo "NO COUPON FOUND";
    exit;
}
echo "Valid: " . ($coupon->isValid() ? 'YES' : 'NO') . "\n";
echo "Active: " . $coupon->is_active . "\n";
echo "Starts: " . $coupon->starts_at . "\n";
echo "Expires: " . $coupon->expires_at . "\n";
echo "Used: " . $coupon->used_count . " / " . $coupon->usage_limit . "\n";
echo "Min Order: " . $coupon->min_order_amount . "\n";
echo "Now: " . now() . "\n";
