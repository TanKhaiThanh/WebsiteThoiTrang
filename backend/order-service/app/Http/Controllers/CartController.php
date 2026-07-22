<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\CartItem;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function index(Request $request)
    {
        $cart = $this->getOrCreateCart($request);
        $cart->load('items');
        return response()->json(['cart' => $cart]);
    }

    public function addItem(Request $request)
    {
        $request->validate([
            'product_id' => 'required|integer',
            'variant_id' => 'nullable|integer',
            'quantity' => 'required|integer|min:1',
            'price' => 'required|numeric|min:0',
        ]);

        $cart = $this->getOrCreateCart($request);

        $existing = $cart->items()
            ->where('product_id', $request->product_id)
            ->where('variant_id', $request->variant_id)
            ->first();

        if ($existing) {
            $existing->update(['quantity' => $existing->quantity + $request->quantity]);
        } else {
            $cart->items()->create($request->only(['product_id', 'variant_id', 'quantity', 'price']));
        }

        return response()->json(['message' => 'Item added', 'cart' => $cart->load('items')]);
    }

    public function updateItem(Request $request, $itemId)
    {
        $request->validate(['quantity' => 'required|integer|min:1']);

        $cart = $this->getOrCreateCart($request);
        $item = $cart->items()->find($itemId);

        if (!$item) return response()->json(['error' => 'Item not found'], 404);

        $item->update(['quantity' => $request->quantity]);
        return response()->json(['message' => 'Item updated', 'cart' => $cart->load('items')]);
    }

    public function removeItem(Request $request, $itemId)
    {
        $cart = $this->getOrCreateCart($request);
        $cart->items()->where('id', $itemId)->delete();
        return response()->json(['message' => 'Item removed', 'cart' => $cart->load('items')]);
    }

    private function getOrCreateCart(Request $request): Cart
    {
        $userId = $request->input('auth_user_id');
        $sessionId = $request->header('X-Session-ID', $request->ip());

        if ($userId) {
            return Cart::firstOrCreate(['user_id' => $userId]);
        }
        return Cart::firstOrCreate(['session_id' => $sessionId]);
    }
}
