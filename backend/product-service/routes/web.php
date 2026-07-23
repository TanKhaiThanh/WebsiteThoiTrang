<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;

Route::get('/', function () {
    return view('welcome');
});

// Bypass Docker symlink issues by serving files directly via PHP
Route::get('/storage/{path}', function ($path) {
    try {
        $filePath = storage_path('app/public/' . $path);
        if (file_exists($filePath)) {
            $mimeType = File::mimeType($filePath);
            return response()->file($filePath, [
                'Content-Type' => $mimeType,
                'Cache-Control' => 'public, max-age=86400'
            ]);
        }
        return response()->json(['error' => 'Not found in storage_path', 'path' => $filePath], 404);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
})->where('path', '.*');

