<?php

use Illuminate\Support\Facades\Route;

// Health check
Route::get('/health', fn() => response()->json(['status' => 'ok', 'service' => 'user-service']));

// Auth (Public)
Route::post('/auth/register', [\App\Http\Controllers\AuthController::class, 'register']);
Route::post('/auth/login', [\App\Http\Controllers\AuthController::class, 'login']);
Route::post('/auth/forgot-password', [\App\Http\Controllers\AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password', [\App\Http\Controllers\AuthController::class, 'resetPassword']);

// Protected routes
Route::middleware(\App\Http\Middleware\JwtMiddleware::class)->group(function () {
    // Auth
    Route::post('/auth/logout', [\App\Http\Controllers\AuthController::class, 'logout']);
    Route::get('/auth/me', [\App\Http\Controllers\AuthController::class, 'me']);
    Route::put('/auth/me', [\App\Http\Controllers\AuthController::class, 'updateProfile']);

    // Notifications
    Route::get('/notifications', [\App\Http\Controllers\NotificationController::class, 'index']);
    Route::put('/notifications/{id}/read', [\App\Http\Controllers\NotificationController::class, 'markAsRead']);
    Route::put('/notifications/read-all', [\App\Http\Controllers\NotificationController::class, 'markAllAsRead']);

    // Admin only - User Management
    Route::middleware(\App\Http\Middleware\RoleMiddleware::class . ':admin')->group(function () {
        Route::get('/users/stats', [\App\Http\Controllers\StatsController::class, 'index']);
        Route::get('/users', [\App\Http\Controllers\UserController::class, 'index']);
        Route::get('/users/{id}', [\App\Http\Controllers\UserController::class, 'show']);
        Route::put('/users/{id}/role', [\App\Http\Controllers\UserController::class, 'updateRole']);
        Route::post('/users/{id}/ban', [\App\Http\Controllers\UserController::class, 'toggleBan']);
    });
});
