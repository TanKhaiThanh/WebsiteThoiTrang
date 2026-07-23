<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Http;

Route::get('/', function () {
    return view('welcome');
});

// Proxy storage images from product-service
Route::get('/storage/{path}', function ($path) {
    $url = env('PRODUCT_SERVICE_URL', 'http://product-service:8002') . '/storage/' . $path;
    $response = Http::get($url);
    
    if ($response->successful()) {
        return response($response->body(), 200, [
            'Content-Type' => $response->header('Content-Type')
        ]);
    }
    return abort(404);
})->where('path', '.*');
