<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class StatsController extends Controller
{
    public function index(Request $request)
    {
        // Admin or Staff role required
        $role = $request->input('auth_user_role');
        if (!in_array($role, ['admin', 'staff'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $totalUsers = User::count();
        
        $roles = ['admin', 'staff', 'shipper', 'customer'];
        $usersByRole = [];
        foreach ($roles as $r) {
            $usersByRole[$r] = User::where('role', $r)->count();
        }

        // New users this month
        $newUsersThisMonth = User::whereYear('created_at', now()->year)
            ->whereMonth('created_at', now()->month)
            ->count();

        return response()->json([
            'total_users' => $totalUsers,
            'users_by_role' => $usersByRole,
            'new_users_this_month' => $newUsersThisMonth,
        ]);
    }
}
