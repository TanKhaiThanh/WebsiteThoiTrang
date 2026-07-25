<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class OptionalJwtMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken();

        if ($token) {
            try {
                $decoded = JWT::decode($token, new Key(env('JWT_SECRET'), 'HS256'));
                $request->merge([
                    'auth_user_id' => $decoded->sub,
                    'auth_user_role' => $decoded->role ?? 'customer',
                    'auth_user_email' => $decoded->email ?? '',
                ]);
            } catch (\Exception $e) {
                // Ignore invalid tokens for optional routes, treat as guest
            }
        }

        return $next($request);
    }
}
