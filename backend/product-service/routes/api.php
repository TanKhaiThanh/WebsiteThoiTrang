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
        Route::get('/products/manage/all', [\App\Http\Controllers\ProductController::class, 'adminIndex']);
        Route::post('/products', [\App\Http\Controllers\ProductController::class, 'store']);
        Route::put('/products/{id}', [\App\Http\Controllers\ProductController::class, 'update']);

        // Inventory
        Route::put('/inventory/{variantId}', [\App\Http\Controllers\InventoryController::class, 'update']);
        Route::get('/inventory/{variantId}/transactions', [\App\Http\Controllers\InventoryController::class, 'transactions']);

        // Media
        Route::post('/media/upload', [\App\Http\Controllers\MediaController::class, 'upload']);
        Route::post('/media/upload-multiple', [\App\Http\Controllers\MediaController::class, 'uploadMultiple']);

        // Banners
        Route::post('/banners', [\App\Http\Controllers\BannerController::class, 'store']);
        Route::put('/banners/{banner}', [\App\Http\Controllers\BannerController::class, 'update']);
        Route::delete('/banners/{banner}', [\App\Http\Controllers\BannerController::class, 'destroy']);
        
        // Reviews
        Route::put('/reviews/{review}/approve', [\App\Http\Controllers\ReviewController::class, 'approve']);
        Route::delete('/reviews/{review}', [\App\Http\Controllers\ReviewController::class, 'destroy']);
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
Route::get('/products/filters', [\App\Http\Controllers\ProductController::class, 'getFilters']);
Route::get('/products/{id}', [\App\Http\Controllers\ProductController::class, 'show']);
Route::get('/inventory/{variantId}', [\App\Http\Controllers\InventoryController::class, 'show']);

// Banners & Reviews
Route::get('/banners', [\App\Http\Controllers\BannerController::class, 'index']);
Route::get('/reviews', [\App\Http\Controllers\ReviewController::class, 'index']);
Route::post('/reviews', [\App\Http\Controllers\ReviewController::class, 'store']);

// New File Stream Endpoint to bypass Symlinks
Route::get('/media/image/{path}', [\App\Http\Controllers\MediaController::class, 'serveImage'])->where('path', '.*');

