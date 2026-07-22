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

        // Admin/Staff/Shipper see all, customer sees only own
        if (!in_array($role, ['admin', 'staff', 'shipper'])) {
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

        $subtotal = collect($request->items)->sum(fn($i) => $i['price'] * $i['quantity']);
        $voucherDiscount = $request->input('voucher_discount', 0);
        $shippingDiscount = $request->input('shipping_discount', 0);
        $pointsDiscount = $request->input('points_discount', 0);
        $shippingFee = $request->input('shipping_fee', 30000);
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

        foreach ($request->items as $item) {
            $order->items()->create($item);
        }

        return response()->json([
            'message' => 'Order created',
            'order' => $order->load('items'),
        ], 201);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate(['status' => 'required|in:pending,confirmed,shipping,delivered,cancelled,returned']);

        $order = Order::find($id);
        if (!$order) return response()->json(['error' => 'Order not found'], 404);

        $order->update(['status' => $request->status]);

        if ($request->status === 'delivered') {
            $order->update(['payment_status' => 'paid']);
        }

        return response()->json(['message' => 'Status updated', 'order' => $order]);
    }
}
