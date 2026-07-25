<?php

use Illuminate\Support\Facades\Route;

Route::get('/health', fn() => response()->json(['status' => 'ok', 'service' => 'order-service']));

// Cart (supports both guest and authenticated user)
Route::middleware(\App\Http\Middleware\OptionalJwtMiddleware::class)->group(function () {
    Route::get('/cart', [\App\Http\Controllers\CartController::class, 'index']);
    Route::post('/cart/items', [\App\Http\Controllers\CartController::class, 'addItem']);
    Route::put('/cart/items/{id}', [\App\Http\Controllers\CartController::class, 'updateItem']);
    Route::delete('/cart/items/{id}', [\App\Http\Controllers\CartController::class, 'removeItem']);
});

    // Protected routes
Route::middleware(\App\Http\Middleware\JwtMiddleware::class)->group(function () {
    // Cart Merge
    Route::post('/cart/merge', [\App\Http\Controllers\CartController::class, 'merge']);
    // Orders (Customer)
    Route::get('/orders/stats', [\App\Http\Controllers\StatsController::class, 'index']);
    Route::post('/orders', [\App\Http\Controllers\OrderController::class, 'store']);
    Route::get('/orders', [\App\Http\Controllers\OrderController::class, 'index']);
    Route::get('/orders/{id}', [\App\Http\Controllers\OrderController::class, 'show']);
    Route::post('/orders/{id}/cancel', [\App\Http\Controllers\OrderController::class, 'cancel']);

    // Payment
    Route::post('/payments/create', [\App\Http\Controllers\PaymentController::class, 'create']);

    // Returns
    Route::post('/returns', [\App\Http\Controllers\ReturnController::class, 'store']);
    Route::get('/returns', [\App\Http\Controllers\ReturnController::class, 'index']);

    // Admin/Staff
    Route::middleware(\App\Http\Middleware\RoleMiddleware::class . ':admin,staff,shipper')->group(function () {
        Route::put('/orders/{id}/status', [\App\Http\Controllers\OrderController::class, 'updateStatus']);
    });

    Route::middleware(\App\Http\Middleware\RoleMiddleware::class . ':admin')->group(function () {
        Route::post('/returns/{id}/approve', [\App\Http\Controllers\ReturnController::class, 'approve']);
        Route::post('/returns/{id}/reject', [\App\Http\Controllers\ReturnController::class, 'reject']);
    });
});

// VNPay callback (public - no auth needed)
Route::get('/payments/callback', [\App\Http\Controllers\PaymentController::class, 'callback']);
Route::post('/payments/ipn', [\App\Http\Controllers\PaymentController::class, 'callback']);
