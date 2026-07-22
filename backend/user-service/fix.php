<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$u = \App\Models\User::where('email', 'customer@gmail.com')->first();
if ($u) {
    echo "Found user: " . $u->email . "\n";
    $u->password = \Illuminate\Support\Facades\Hash::make('password');
    $u->save();
    echo "User password updated completely.\n";
} else {
    echo "User not found.\n";
}
