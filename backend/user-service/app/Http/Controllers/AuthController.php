<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Firebase\JWT\JWT;

class AuthController extends Controller
{
    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
            'phone' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password, // auto-hashed via cast
            'phone' => $request->phone,
            'role' => 'customer',
        ]);

        $token = $this->generateToken($user);

        return response()->json([
            'message' => 'Registration successful',
            'user' => $this->formatUser($user),
            'token' => $token,
        ], 201);
    }

    /**
     * Forgot Password
     */
    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['error' => 'Không tìm thấy tài khoản với email này.'], 404);
        }

        // Tạo mã ngẫu nhiên 6 chữ số
        $token = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
        
        // Lưu tạm vào Cache 15 phút
        \Illuminate\Support\Facades\Cache::put('reset_token_' . $request->email, $token, now()->addMinutes(15));

        return response()->json([
            'message' => 'Request successful',
            'reset_token' => $token
        ], 200);
    }

    /**
     * Reset Password
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'token' => 'required|string',
            'new_password' => 'required|string|min:6'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $cachedToken = \Illuminate\Support\Facades\Cache::get('reset_token_' . $request->email);

        if (!$cachedToken || $cachedToken !== $request->token) {
            return response()->json(['error' => 'Mã khôi phục không hợp lệ hoặc đã hết hạn.'], 400);
        }

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['error' => 'Không tìm thấy tài khoản.'], 404);
        }

        $user->password = $request->new_password; // Model User đã tự động Hash mật khẩu thông qua Casts
        $user->save();

        // Xóa token đi
        \Illuminate\Support\Facades\Cache::forget('reset_token_' . $request->email);

        return response()->json(['message' => 'Đặt lại mật khẩu thành công.'], 200);
    }

    /**
     * Login user
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['error' => 'Invalid credentials'], 401);
        }

        if ($user->is_banned) {
            return response()->json(['error' => 'Your account has been banned'], 403);
        }

        $token = $this->generateToken($user);

        return response()->json([
            'message' => 'Login successful',
            'user' => $this->formatUser($user),
            'token' => $token,
        ]);
    }

    /**
     * Logout - invalidate token (client-side token removal)
     */
    public function logout(Request $request)
    {
        return response()->json(['message' => 'Logged out successfully']);
    }

    /**
     * Get current user profile
     */
    public function me(Request $request)
    {
        $user = User::find($request->input('auth_user_id'));

        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        return response()->json(['user' => $this->formatUser($user)]);
    }

    /**
     * Update current user profile
     */
    public function updateProfile(Request $request)
    {
        $user = User::find($request->input('auth_user_id'));

        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|nullable|string|max:20',
            'address' => 'sometimes|nullable|string|max:500',
            'avatar' => 'sometimes|nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user->update($request->only(['name', 'phone', 'address', 'avatar']));

        return response()->json([
            'message' => 'Profile updated',
            'user' => $this->formatUser($user),
        ]);
    }

    /**
     * Generate JWT token
     */
    private function generateToken(User $user): string
    {
        $payload = [
            'iss' => env('APP_NAME', 'ASMAW'),
            'sub' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
            'iat' => time(),
            'exp' => time() + (60 * 60 * 24 * 7), // 7 days
        ];

        return JWT::encode($payload, env('JWT_SECRET'), 'HS256');
    }

    /**
     * Format user response
     */
    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'avatar' => $user->avatar,
            'address' => $user->address,
            'created_at' => $user->created_at,
        ];
    }
}
