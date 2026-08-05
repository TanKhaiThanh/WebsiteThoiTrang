<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->input('auth_user_id');
        $role = $request->input('auth_user_role');

        $query = Order::with('items');

        // Admin/Staff/Shipper can see all if ?all_users=1 is explicitly passed
        if (in_array($role, ['admin', 'staff', 'shipper']) && $request->input('all_users') == '1') {
            // Shipper chỉ được thấy những đơn đã qua khâu đóng gói
            if ($role === 'shipper') {
                $query->whereNotIn('status', ['pending', 'confirmed']);
            }
        } else {
            // Customer or Admin looking at personal profile only sees own
            $query->where('user_id', $userId);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->orderBy('created_at', 'desc')->paginate(15));
    }

    public function show(Request $request, $id)
    {
        $order = Order::with(['items', 'payment', 'shipment', 'returnRequest'])->find($id);

        if (!$order) return response()->json(['error' => 'Order not found'], 404);

        $role = $request->input('auth_user_role');
        if (!in_array($role, ['admin', 'staff']) && $order->user_id != $request->input('auth_user_id')) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        return response()->json(['order' => $order]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer',
            'items.*.variant_id' => 'nullable|integer',
            'items.*.product_name' => 'required|string',
            'items.*.variant_info' => 'nullable|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'required|string|max:20',
            'shipping_address' => 'required|string',
            'payment_method' => 'required|in:cod,vnpay',
            'voucher_discount' => 'nullable|numeric|min:0',
            'shipping_discount' => 'nullable|numeric|min:0',
            'points_discount' => 'nullable|numeric|min:0',
            'shipping_fee' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Reserve stock via product-service
        $reservePayload = [
            'items' => collect($request->items)->map(function($i) {
                return ['variant_id' => $i['variant_id'], 'qty' => $i['quantity']];
            })->toArray()
        ];
        
        $token = $request->bearerToken();
        try {
            $response = \Illuminate\Support\Facades\Http::withToken($token)
                ->post('http://asmaw-product-service:8002/api/inventory/reserve', $reservePayload);
                
            if (!$response->successful()) {
                return response()->json(['error' => 'Một hoặc nhiều sản phẩm đã hết hàng hoặc không đủ số lượng trong kho.'], 400); 
            }
            $reservedItems = $response->json('reserved');
        } catch (\Exception $e) {
            return response()->json(['error' => 'Lỗi kết nối Kho xuất hàng: ' . $e->getMessage()], 500); 
        }

        $subtotal = 0;
        $orderItemsPayload = $request->items;
        foreach ($orderItemsPayload as &$itm) {
            if (isset($reservedItems)) {
                $verified = collect($reservedItems)->firstWhere('variant_id', $itm['variant_id']);
                if ($verified && isset($verified['verified_price'])) {
                    $itm['price'] = $verified['verified_price']; // Áp đặt giá từ Hệ thống
                }
            }
            $subtotal += $itm['price'] * $itm['quantity'];
        }
        $voucherDiscount = $request->input('voucher_discount', 0);
        $shippingDiscount = $request->input('shipping_discount', 0);
        $pointsDiscount = $request->input('points_discount', 0);
        
        // Auto Calculate Shipping Fee via Settings
        $settings = \App\Models\ShippingSetting::first();
        $shippingFee = 30000;
        
        if ($settings) {
            if ($subtotal >= $settings->free_shipping_threshold) {
                $shippingFee = 0;
            } else {
                $address = mb_strtolower($request->shipping_address, 'UTF-8');
                if (str_contains($address, 'hồ chí minh') || str_contains($address, 'hcm')) {
                    $shippingFee = $settings->zone_1_fee;
                } elseif (preg_match('/(bình dương|đồng nai|long an|tây ninh|bà rịa|vũng tàu)/', $address)) {
                    $shippingFee = $settings->zone_2_fee;
                } elseif (preg_match('/(cần thơ|đà nẵng|bình thuận|tiền giang|bến tre|đồng tháp|vĩnh long|trà vinh|hậu giang|kiên giang|sóc trăng|bạc liêu|cà mau|an giang|bình phước|lâm đồng|đắk lắk|đắk nông|gia lai|kon tum|khánh hòa|ninh thuận|phú yên)/', $address)) {
                    $shippingFee = $settings->zone_3_fee;
                } else {
                    $shippingFee = $settings->zone_4_fee;
                }
            }
        }
        
        $total = max(0, $subtotal - $voucherDiscount - $pointsDiscount + $shippingFee - $shippingDiscount);

        $order = Order::create([
            'order_number' => 'ASM-' . strtoupper(Str::random(8)),
            'user_id' => $request->input('auth_user_id'),
            'status' => 'pending',
            'subtotal' => $subtotal,
            'voucher_discount' => $voucherDiscount,
            'shipping_discount' => $shippingDiscount,
            'points_discount' => $pointsDiscount,
            'shipping_fee' => $shippingFee,
            'total' => $total,
            'customer_name' => $request->customer_name,
            'customer_phone' => $request->customer_phone,
            'shipping_address' => $request->shipping_address,
            'payment_method' => $request->payment_method,
            'note' => $request->note,
        ]);

        foreach ($orderItemsPayload as $item) {
            $order->items()->create($item);
        }

        // Auto-clear cart after successful order creation
        $userId = $request->input('auth_user_id');
        $sessionId = $request->header('X-Session-ID');
        
        $cartQuery = \App\Models\Cart::query();
        if ($userId) {
            $cartQuery->where('user_id', $userId);
        } else if ($sessionId) {
            $cartQuery->where('session_id', $sessionId);
        }
        $cart = $cartQuery->first();
        if ($cart) {
            $cart->items()->delete();
        }

        return response()->json([
            'message' => 'Order created',
            'order' => $order->load('items'),
        ], 201);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate(['status' => 'required|in:pending,confirmed,shipping,delivered,cancelled,returned']);

        $role = $request->input('auth_user_role');
        
        // 1. Phân quyền: Khách hàng không được dùng API này (Phải dùng hàm cancel)
        if ($role === 'user' || $role === 'customer' || empty($role)) {
            return response()->json(['error' => 'Forbidden. Customers cannot update order status directly.'], 403);
        }

        $order = Order::with('items')->find($id);
        if (!$order) return response()->json(['error' => 'Order not found'], 404);

        $oldStatus = $order->status;
        $newStatus = $request->status;

        if ($oldStatus === $newStatus) {
            return response()->json(['message' => 'Status unchanged', 'order' => $order]);
        }

        // 2. Logic RBAC State Machine
        if ($role !== 'admin') {
            // Cấm sửa đơn đã Đóng/Giao thành công
            if (in_array($oldStatus, ['delivered', 'cancelled', 'returned'])) {
                return response()->json(['error' => 'Forbidden. Order is finalized and cannot be modified except by Admin.'], 403);
            }

            if ($role === 'staff') {
                // Đã chặn đơn chết ở if bên trên, do đó dưới này Staff được toàn quyền nhảy cóc
                // Không cần mảng allowedStaff nữa.
            } elseif ($role === 'shipper') {
                $allowedShipper = [
                    'shipping' => ['delivered', 'returned', 'cancelled']
                ];
                if (!isset($allowedShipper[$oldStatus]) || !in_array($newStatus, $allowedShipper[$oldStatus])) {
                    return response()->json(['error' => "Forbidden transition for Shipper: {$oldStatus} -> {$newStatus}"], 403);
                }
            } else {
                 return response()->json(['error' => "Forbidden Role: {$role}"], 403);
            }
        }

        // 3. Cập nhật & Gọi qua Kho Hàng
        $order->update(['status' => $newStatus]);

        $payload = [
            'items' => $order->items->map(function($i) {
                return ['variant_id' => $i->variant_id, 'qty' => $i->quantity];
            })->toArray()
        ];
        
        $token = $request->bearerToken();

        // Xử lý Hủy / Giao / Hoàn Thành - Chỉ kích hoạt nếu trạng thái cũ chưa nằm trong các trạng thái chốt kho
        if (in_array($newStatus, ['cancelled', 'returned']) && !in_array($oldStatus, ['cancelled', 'returned', 'delivered'])) {
            \Illuminate\Support\Facades\Http::withToken($token)
                ->post('http://asmaw-product-service:8002/api/inventory/release', $payload);
        } elseif ($newStatus === 'delivered' && $oldStatus !== 'delivered') {
            $order->update(['payment_status' => 'paid']);
            \Illuminate\Support\Facades\Http::withToken($token)
                ->post('http://asmaw-product-service:8002/api/inventory/finalize', $payload);
        }

        return response()->json(['message' => 'Status updated', 'order' => $order]);
    }
    public function cancel(Request $request, $id)
    {
        $order = Order::with('items')->find($id);

        if (!$order) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        if ($order->status !== 'pending') {
            return response()->json(['error' => 'Only pending orders can be cancelled'], 400);
        }

        $role = $request->input('auth_user_role');
        if (!in_array($role, ['admin', 'staff']) && $order->user_id != $request->input('auth_user_id')) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $order->update(['status' => 'cancelled']);
        
        $payload = [
            'items' => $order->items->map(function($i) {
                return ['variant_id' => $i->variant_id, 'qty' => $i->quantity];
            })->toArray()
        ];
        
        \Illuminate\Support\Facades\Http::withToken($request->bearerToken())
            ->post('http://asmaw-product-service:8002/api/inventory/release', $payload);
        
        return response()->json(['message' => 'Order cancelled successfully', 'order' => $order]);
    }
}
