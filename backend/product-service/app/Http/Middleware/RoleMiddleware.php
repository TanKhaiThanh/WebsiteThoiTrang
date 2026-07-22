<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $userRole = $request->input('auth_user_role', 'guest');

        if (!in_array($userRole, $roles)) {
            return response()->json(['error' => 'Forbidden. Required roles: ' . implode(', ', $roles)], 403);
        }

        return $next($request);
    }
}
