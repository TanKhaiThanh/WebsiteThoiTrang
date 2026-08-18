<?php

use Illuminate\Support\Facades\Route;

Route::get('/health', fn() => response()->json(['status' => 'ok', 'service' => 'promotion-service']));

// Protected routes
Route::middleware(\App\Http\Middleware\JwtMiddleware::class)->group(function () {
    // Coupon validation (Customer)
    Route::post('/coupons/validate', [\App\Http\Controllers\CouponController::class, 'validate_coupon']);
    
    // Internal: use coupon (called by order-service)
    Route::post('/coupons/use', [\App\Http\Controllers\CouponController::class, 'use_coupon']);

    // Points
    Route::get('/points/{userId}', [\App\Http\Controllers\PointController::class, 'show']);
    Route::post('/points/redeem', [\App\Http\Controllers\PointController::class, 'redeem']);

    // Internal: earn points (called by order-service)
    Route::post('/points/earn', [\App\Http\Controllers\PointController::class, 'earn']);

    // Admin only - Coupon management
    Route::middleware(\App\Http\Middleware\RoleMiddleware::class . ':admin')->group(function () {
        Route::get('/coupons', [\App\Http\Controllers\CouponController::class, 'index']);
        Route::post('/coupons', [\App\Http\Controllers\CouponController::class, 'store']);
        Route::put('/coupons/{id}', [\App\Http\Controllers\CouponController::class, 'update']);
        Route::delete('/coupons/{id}', [\App\Http\Controllers\CouponController::class, 'destroy']);
    });
});
