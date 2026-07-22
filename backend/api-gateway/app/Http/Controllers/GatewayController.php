<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class GatewayController extends Controller
{
    /**
     * Proxy request to User Service
     */
    public function proxyToUser(Request $request, ?string $path = '')
    {
        return $this->proxy($request, env('USER_SERVICE_URL', 'http://user-service:8001'), $path);
    }

    /**
     * Proxy request to Product Service
     */
    public function proxyToProduct(Request $request, ?string $path = '')
    {
        return $this->proxy($request, env('PRODUCT_SERVICE_URL', 'http://product-service:8002'), $path);
    }

    /**
     * Proxy request to Order Service
     */
    public function proxyToOrder(Request $request, ?string $path = '')
    {
        return $this->proxy($request, env('ORDER_SERVICE_URL', 'http://order-service:8003'), $path);
    }

    /**
     * Proxy request to Promotion Service
     */
    public function proxyToPromotion(Request $request, ?string $path = '')
    {
        return $this->proxy($request, env('PROMOTION_SERVICE_URL', 'http://promotion-service:8004'), $path);
    }

    /**
     * Core proxy logic — forward request to target service
     */
    private function proxy(Request $request, string $baseUrl, ?string $path = '')
    {
        // Build target URL from route prefix + remaining path
        $segments = $request->segments();
        // Remove 'api' prefix if present
        $routePath = collect($segments)->skip(1)->implode('/');
        $url = rtrim($baseUrl, '/') . '/api/' . $routePath;

        // Pass query params
        if ($request->getQueryString()) {
            $url .= '?' . $request->getQueryString();
        }

        // Build HTTP request
        $method = strtolower($request->method());
        $http = Http::withHeaders($this->getForwardHeaders($request))
            ->timeout(30);

        // Forward request based on method
        try {
            if (in_array($method, ['get', 'delete'])) {
                $response = $http->$method($url);
            } elseif ($request->hasFile('file') || $request->hasFile('image') || $request->hasFile('images')) {
                // Handle file uploads
                $multipart = $http->asMultipart();
                foreach ($request->allFiles() as $key => $files) {
                    $files = is_array($files) ? $files : [$files];
                    foreach ($files as $file) {
                        $multipart = $multipart->attach($key, file_get_contents($file->getRealPath()), $file->getClientOriginalName());
                    }
                }
                foreach ($request->except(array_keys($request->allFiles())) as $key => $value) {
                    $multipart = $multipart->attach($key, $value);
                }
                $response = $multipart->post($url);
            } else {
                $response = $http->$method($url, $request->all());
            }

            return response($response->body(), $response->status())
                ->withHeaders([
                    'Content-Type' => $response->header('Content-Type') ?? 'application/json',
                ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Service unavailable',
                'message' => $e->getMessage(),
            ], 503);
        }
    }

    /**
     * Extract headers to forward (Authorization, Accept, etc.)
     */
    private function getForwardHeaders(Request $request): array
    {
        $headers = [
            'Accept' => 'application/json',
        ];

        if ($request->hasHeader('Authorization')) {
            $headers['Authorization'] = $request->header('Authorization');
        }

        if ($request->hasHeader('X-Requested-With')) {
            $headers['X-Requested-With'] = $request->header('X-Requested-With');
        }

        return $headers;
    }
}
