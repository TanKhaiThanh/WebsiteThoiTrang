<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use App\Mail\ResetPasswordMail;
use Exception;

class ForgotPasswordController extends Controller
{
    /**
     * POST /api/auth/forgot-password
     * Gửi mã OTP vào Email
     */
    public function sendOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email'
        ], [
            'email.exists' => 'Email này không tồn tại trong hệ thống.'
        ]);

        $user = User::where('email', $request->email)->first();

        // Check if OTP was sent recently (prevent spam)
        $cacheKeyLastSent = 'otp_last_sent_' . $user->email;
        if (Cache::has($cacheKeyLastSent)) {
            return response()->json([
                'error' => 'Vui lòng đợi 60 giây trước khi yêu cầu mã mới.'
            ], 429);
        }

        // Sinh OTP 6 số
        $otp = str_pad(rand(100000, 999999), 6, '0', STR_PAD_LEFT);
        $cacheKey = 'otp_' . $user->email;

        // Lưu OTP vào Cache 5 phút
        Cache::put($cacheKey, $otp, now()->addMinutes(5));
        
        // Block resend for 60s
        Cache::put($cacheKeyLastSent, true, now()->addSeconds(60));

        try {
            Mail::to($user->email)->send(new ResetPasswordMail($otp, $user->name));
        } catch (Exception $e) {
            Log::error('Send OTP Email Error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Hệ thống gửi Mail gặp lỗi. Xin vui lòng thử lại sau.'
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Mã OTP đã được gửi đến email của bạn.'
        ]);
    }

    /**
     * POST /api/auth/reset-password
     * Xác thực OTP và đặt lại mật khẩu
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'otp' => 'required|string|size:6',
            'password' => 'required|string|min:6|confirmed'
        ], [
            'email.exists' => 'Email này không tồn tại.',
            'password.confirmed' => 'Mật khẩu xác nhận không khớp.'
        ]);

        $cacheKey = 'otp_' . $request->email;

        if (!Cache::has($cacheKey)) {
            return response()->json(['error' => 'Mã OTP đã hết hạn hoặc không tồn tại.'], 400);
        }

        $cachedOtp = Cache::get($cacheKey);

        if ($cachedOtp !== $request->otp) {
            return response()->json(['error' => 'Mã OTP không chính xác.'], 400);
        }

        // OTP OK
        $user = User::where('email', $request->email)->first();
        $user->password = Hash::make($request->password);
        $user->save();

        // Xóa OTP khỏi cache
        Cache::forget($cacheKey);

        return response()->json([
            'success' => true,
            'message' => 'Lấy lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.'
        ]);
    }
}
