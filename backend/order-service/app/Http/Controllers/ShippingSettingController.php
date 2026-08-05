<?php

namespace App\Http\Controllers;

use App\Models\ShippingSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ShippingSettingController extends Controller
{
    /**
     * Lấy cài đặt phí giao hàng. Nếu chưa có thì tự khởi tạo mặc định.
     */
    public function getSettings()
    {
        $settings = ShippingSetting::first();
        if (!$settings) {
            $settings = ShippingSetting::create([
                'zone_1_fee' => 15000,
                'zone_2_fee' => 25000,
                'zone_3_fee' => 35000,
                'zone_4_fee' => 45000,
                'free_shipping_threshold' => 500000,
            ]);
        }
        return response()->json($settings);
    }

    /**
     * Cập nhật cài đặt phí giao hàng (Dành cho Admin)
     */
    public function updateSettings(Request $request)
    {
        // Chỉ admin mới gọi được endpoint này (middleware ở api.php)
        $role = $request->input('auth_user_role');
        if (!in_array($role, ['admin', 'staff'])) {
            return response()->json(['error' => 'Forbidden Access'], 403);
        }

        $validator = Validator::make($request->all(), [
            'zone_1_fee' => 'required|integer|min:0',
            'zone_2_fee' => 'required|integer|min:0',
            'zone_3_fee' => 'required|integer|min:0',
            'zone_4_fee' => 'required|integer|min:0',
            'free_shipping_threshold' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $settings = ShippingSetting::first();
        if (!$settings) {
            $settings = new ShippingSetting();
        }

        $settings->fill($request->only([
            'zone_1_fee',
            'zone_2_fee',
            'zone_3_fee',
            'zone_4_fee',
            'free_shipping_threshold'
        ]));
        
        $settings->save();

        return response()->json([
            'message' => 'Cập nhật phí vận chuyển thành công!',
            'settings' => $settings
        ]);
    }
}
