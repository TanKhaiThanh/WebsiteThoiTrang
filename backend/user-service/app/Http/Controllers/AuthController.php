<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Http;

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

        try {
            \Illuminate\Support\Facades\DB::transaction(function () use ($request) {
                $user = User::create([
                    'name' => $request->name,
                    'email' => $request->email,
                    'password' => $request->password, // auto-hashed via cast
                    'phone' => $request->phone,
                    'role' => 'customer',
                ]);

                $this->sendOtpEmail($request->email);
            });

            return response()->json([
                'message' => 'Đăng ký tài khoản thành công. Vui lòng xác thực Email.',
                'requires_verification' => true,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Đăng ký thất bại. Lỗi hệ thống: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper to send OTP Emails
     */
    private function sendOtpEmail($email) 
    {
        $otp = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
        Cache::put('otp_verification_' . $email, $otp, now()->addMinutes(10));
        
        Mail::raw("Mã xác thực tài khoản ASMAW của bạn là: $otp. Mã này có hiệu lực 10 phút.", function($msg) use ($email) {
            $msg->to($email)->subject('Xác thực tài khoản ASMAW');
        });
    }

    /**
     * Verify OTP
     */
    public function verifyOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'otp'   => 'required|string|size:6'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $cachedOtp = Cache::get('otp_verification_' . $request->email);

        if (!$cachedOtp || $cachedOtp !== $request->otp) {
            return response()->json(['error' => 'Mã OTP không hợp lệ hoặc đã hết hạn.'], 400);
        }

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['error' => 'Tài khoản không tồn tại.'], 404);
        }

        $user->email_verified_at = now();
        $user->save();
        
        Cache::forget('otp_verification_' . $request->email);

        $token = $this->generateToken($user);
        return response()->json([
            'message' => 'Xác thực tài khoản thành công.',
            'user' => $this->formatUser($user),
            'token' => $token
        ], 200);
    }

    /**
     * Resend OTP
     */
    public function resendOtp(Request $request)
    {
         $validator = Validator::make($request->all(), [
            'email' => 'required|email'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['error' => 'Tài khoản không tồn tại.'], 404);
        }

        if ($user->email_verified_at) {
            return response()->json(['error' => 'Tài khoản này đã được xác thực.'], 400);
        }

        $this->sendOtpEmail($request->email);

        return response()->json([
            'message' => 'Mã OTP mới đã được gửi đến email của bạn.'
        ], 200);
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
            'message' => 'Gửi yêu cầu thành công.',
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
            return response()->json(['error' => 'Email hoặc mật khẩu không chính xác.'], 401);
        }

        if ($user->is_banned) {
            return response()->json(['error' => 'Tài khoản của bạn đã bị khóa.'], 403);
        }

        if (is_null($user->email_verified_at)) {
            $this->sendOtpEmail($request->email);
            return response()->json([
                'error' => 'Tài khoản chưa được xác thực Email. Một mã OTP mới đã được gửi.',
                'requires_verification' => true
            ], 403);
        }

        $token = $this->generateToken($user);

        return response()->json([
            'message' => 'Đăng nhập thành công.',
            'user' => $this->formatUser($user),
            'token' => $token,
        ]);
    }

    /**
     * Logout - invalidate token (client-side token removal)
     */
    public function logout(Request $request)
    {
        return response()->json(['message' => 'Đăng xuất thành công.']);
    }

    /**
     * Get current user profile
     */
    public function me(Request $request)
    {
        $user = User::find($request->input('auth_user_id'));

        if (!$user) {
            return response()->json(['error' => 'Tài khoản không tồn tại trong hệ thống.'], 404);
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
            'message' => 'Cập nhật hồ sơ thành công.',
            'user' => $this->formatUser($user),
        ]);
    }

    /**
     * Google Login / Register
     */
    public function googleLogin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $response = Http::get('https://oauth2.googleapis.com/tokeninfo?id_token=' . $request->token);
            
            if (!$response->successful()) {
                return response()->json(['error' => 'Google Token không hợp lệ hoặc không có quyền truy cập.'], 401);
            }
            
            $payload = $response->json();

            if (!isset($payload['email'])) {
                return response()->json(['error' => 'Google Token không chứa thông tin Email hợp lệ.'], 401);
            }

            $email = $payload['email'];
            $name = $payload['name'] ?? 'Google User';
            $google_id = $payload['sub'];
            $avatar = $payload['picture'] ?? null;

            $user = User::where('email', $email)->first();

            if ($user) {
                // Trường hợp 2 & 3: Tồn tại email
                if (empty($user->google_id)) {
                    $user->google_id = $google_id;
                    if (empty($user->avatar)) {
                        $user->avatar = $avatar;
                    }
                    $user->save();
                }
            } else {
                // Trường hợp 1: Chưa có tài khoản
                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'password' => \Illuminate\Support\Str::random(60), // Random ko thể đoán
                    'google_id' => $google_id,
                    'role' => 'customer',
                    'avatar' => $avatar
                ]);
            }

            $token = $this->generateToken($user);

            return response()->json([
                'message' => 'Đăng nhập Google thành công.',
                'user' => $this->formatUser($user),
                'token' => $token,
            ], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Lỗi xác thực Google: ' . $e->getMessage()], 500);
        }
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
