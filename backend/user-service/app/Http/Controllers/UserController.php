<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    /**
     * List all users (Admin only)
     */
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 15));

        return response()->json($users);
    }

    /**
     * Get single user
     */
    public function show($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        return response()->json(['user' => $user->makeHidden(['password', 'remember_token'])]);
    }

    /**
     * Update user role (Admin only)
     */
    public function updateRole(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'role' => 'required|in:admin,staff,shipper,customer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::find($id);

        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        $user->update(['role' => $request->role]);

        return response()->json([
            'message' => 'Role updated',
            'user' => $user->makeHidden(['password', 'remember_token']),
        ]);
    }

    /**
     * Ban/unban user (Admin only)
     */
    public function toggleBan(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        if ($user->role === 'admin') {
            return response()->json(['error' => 'Cannot ban admin users'], 403);
        }

        $user->update(['is_banned' => !$user->is_banned]);

        return response()->json([
            'message' => $user->is_banned ? 'User banned' : 'User unbanned',
            'user' => $user->makeHidden(['password', 'remember_token']),
        ]);
    }
}
