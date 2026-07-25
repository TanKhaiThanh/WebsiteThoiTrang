<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;
use App\Models\Order;
use App\Models\Payment;
use Carbon\Carbon;

Schedule::call(function () {
    $expiredTime = Carbon::now()->subMinutes(10);
    
    $expiredPayments = Payment::where('method', 'vnpay')
        ->where('status', 'pending')
        ->where('created_at', '<', $expiredTime)
        ->get();

    foreach ($expiredPayments as $payment) {
        $payment->update(['status' => 'failed']);
        
        $order = Order::find($payment->order_id);
        if ($order && $order->status === 'pending') {
            $order->update(['status' => 'cancelled', 'payment_status' => 'failed']);
        }
    }
})->everyMinute();
