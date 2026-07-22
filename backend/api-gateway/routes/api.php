<?php

use Illuminate\Support\Facades\Route;

// Health check
Route::get('/health', fn() => response()->json(['status' => 'ok', 'service' => 'api-gateway']));

// ============ PROXY ROUTES ============

// Auth & User → user-service
Route::any('/auth/{path}', [\App\Http\Controllers\GatewayController::class, 'proxyToUser'])->where('path', '.*');
Route::any('/users/{path?}', [\App\Http\Controllers\GatewayController::class, 'proxyToUser'])->where('path', '.*');
Route::any('/notifications/{path?}', [\App\Http\Controllers\GatewayController::class, 'proxyToUser'])->where('path', '.*');

// Products & Categories & Inventory & Media → product-service
Route::any('/products/{path?}', [\App\Http\Controllers\GatewayController::class, 'proxyToProduct'])->where('path', '.*');
Route::any('/categories/{path?}', [\App\Http\Controllers\GatewayController::class, 'proxyToProduct'])->where('path', '.*');
Route::any('/inventory/{path?}', [\App\Http\Controllers\GatewayController::class, 'proxyToProduct'])->where('path', '.*');
Route::any('/media/{path?}', [\App\Http\Controllers\GatewayController::class, 'proxyToProduct'])->where('path', '.*');

// Cart & Orders & Payments & Shipping & Returns → order-service
Route::any('/cart/{path?}', [\App\Http\Controllers\GatewayController::class, 'proxyToOrder'])->where('path', '.*');
Route::any('/orders/{path?}', [\App\Http\Controllers\GatewayController::class, 'proxyToOrder'])->where('path', '.*');
Route::any('/payments/{path?}', [\App\Http\Controllers\GatewayController::class, 'proxyToOrder'])->where('path', '.*');
Route::any('/shipping/{path?}', [\App\Http\Controllers\GatewayController::class, 'proxyToOrder'])->where('path', '.*');
Route::any('/returns/{path?}', [\App\Http\Controllers\GatewayController::class, 'proxyToOrder'])->where('path', '.*');

// Coupons & Points → promotion-service
Route::any('/coupons/{path?}', [\App\Http\Controllers\GatewayController::class, 'proxyToPromotion'])->where('path', '.*');
Route::any('/points/{path?}', [\App\Http\Controllers\GatewayController::class, 'proxyToPromotion'])->where('path', '.*');
