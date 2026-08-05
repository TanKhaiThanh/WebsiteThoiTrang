<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use App\Models\CouponUsage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CouponController extends Controller
{
    public function index()
    {
        return response()->json(Coupon::orderBy('created_at', 'desc')->paginate(20));
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|unique:coupons,code',
            'name' => 'required|string|max:255',
            'type' => 'required|in:percentage,fixed,free_shipping',
            'value' => 'required|numeric|min:0',
            'min_order_amount' => 'nullable|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:1',
            'exclude_sale_items' => 'nullable|boolean',
            'starts_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after:starts_at',
        ]);

        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $coupon = Coupon::create($request->all());
        return response()->json(['message' => 'Coupon created', 'coupon' => $coupon], 201);
    }

    public function update(Request $request, $id)
    {
        $coupon = Coupon::find($id);
        if (!$coupon) return response()->json(['error' => 'Coupon not found'], 404);

        $coupon->update($request->all());
        return response()->json(['message' => 'Coupon updated', 'coupon' => $coupon]);
    }

    public function destroy($id)
    {
        $coupon = Coupon::find($id);
        if (!$coupon) return response()->json(['error' => 'Not found'], 404);
        $coupon->delete();
        return response()->json(['message' => 'Coupon deleted']);
    }

    /**
     * Validate a coupon code
     */
    public function validate_coupon(Request $request)
    {
        $request->validate(['code' => 'required|string', 'order_total' => 'required|numeric']);

        $coupon = Coupon::where('code', $request->code)->first();

        if (!$coupon) return response()->json(['error' => 'Mã giảm giá không tồn tại'], 404);
        if (!$coupon->isValid()) return response()->json(['error' => 'Mã giảm giá đã hết hạn hoặc không hoạt động'], 422);
        if ($request->order_total < $coupon->min_order_amount) {
            return response()->json(['error' => "Đơn hàng tối thiểu: " . number_format($coupon->min_order_amount, 0, ',', '.') . " đ"], 422);
        }

        // Check if user already used this coupon
        $userId = $request->input('auth_user_id');
        if ($userId && CouponUsage::where('coupon_id', $coupon->id)->where('user_id', $userId)->exists()) {
            return response()->json(['error' => 'Bạn đã sử dụng mã giảm giá này rồi'], 422);
        }

        // Calculate discount
        $discount = match ($coupon->type) {
            'percentage' => min($request->order_total * $coupon->value / 100, $coupon->max_discount ?? PHP_INT_MAX),
            'fixed' => $coupon->value,
            'free_shipping' => $coupon->value,
            default => 0,
        };

        return response()->json([
            'valid' => true,
            'coupon' => $coupon,
            'discount' => $discount,
        ]);
    }
}
