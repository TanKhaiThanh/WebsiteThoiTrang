<?php

use Illuminate\Support\Facades\Route;

Route::get('/health', fn() => response()->json(['status' => 'ok', 'service' => 'product-service']));

// Protected routes (must be defined BEFORE public wildcard routes like /products/{id})
Route::middleware(\App\Http\Middleware\JwtMiddleware::class)->group(function () {
    // Admin/Staff
    Route::middleware(\App\Http\Middleware\RoleMiddleware::class . ':admin,staff')->group(function () {
        // Stats
        Route::get('/products/stats', [\App\Http\Controllers\StatsController::class, 'index']);
        // Categories
        Route::post('/categories', [\App\Http\Controllers\CategoryController::class, 'store']);
        Route::put('/categories/{id}', [\App\Http\Controllers\CategoryController::class, 'update']);

        // Products
        Route::post('/products', [\App\Http\Controllers\ProductController::class, 'store']);
        Route::put('/products/{id}', [\App\Http\Controllers\ProductController::class, 'update']);

        // Inventory
        Route::put('/inventory/{variantId}', [\App\Http\Controllers\InventoryController::class, 'update']);

        // Media
        Route::post('/media/upload', [\App\Http\Controllers\MediaController::class, 'upload']);
        Route::post('/media/upload-multiple', [\App\Http\Controllers\MediaController::class, 'uploadMultiple']);
    });

    // Admin only
    Route::middleware(\App\Http\Middleware\RoleMiddleware::class . ':admin')->group(function () {
        Route::delete('/categories/{id}', [\App\Http\Controllers\CategoryController::class, 'destroy']);
        Route::delete('/products/{id}', [\App\Http\Controllers\ProductController::class, 'destroy']);
    });

    // Internal system routes (inventory reservation)
    Route::post('/inventory/reserve', [\App\Http\Controllers\InventoryController::class, 'reserve']);
    Route::post('/inventory/release', [\App\Http\Controllers\InventoryController::class, 'release']);
});

// Public routes
Route::get('/categories', [\App\Http\Controllers\CategoryController::class, 'index']);
Route::get('/products', [\App\Http\Controllers\ProductController::class, 'index']);
Route::get('/products/{id}', [\App\Http\Controllers\ProductController::class, 'show']);
Route::get('/inventory/{variantId}', [\App\Http\Controllers\InventoryController::class, 'show']);
