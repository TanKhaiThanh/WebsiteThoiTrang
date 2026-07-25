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
        \Illuminate\Support\Facades\Log::info('ADD_CART Payload:', $request->all());
        \Illuminate\Support\Facades\Log::info('ADD_CART Headers:', $request->headers->all());

        try {
            $request->validate([
                'product_id' => 'required|integer',
                'variant_id' => 'nullable|integer',
                'quantity' => 'required|integer|min:1',
                'price' => 'required|numeric|min:0',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Illuminate\Support\Facades\Log::error('ADD_CART Validation Error:', $e->errors());
            throw $e;
        }

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

    public function merge(Request $request)
    {
        $userId = $request->input('auth_user_id');
        $sessionId = $request->input('session_id');

        if (!$userId || !$sessionId) {
            return response()->json(['error' => 'Missing user or session id'], 400);
        }

        $sessionCart = Cart::with('items')->where('session_id', $sessionId)->first();
        $userCart = Cart::firstOrCreate(['user_id' => $userId]);

        if ($sessionCart && $sessionCart->id !== $userCart->id) {
            foreach ($sessionCart->items as $item) {
                $existing = $userCart->items()
                    ->where('product_id', $item->product_id)
                    ->where('variant_id', $item->variant_id)
                    ->first();

                if ($existing) {
                    $existing->update(['quantity' => $existing->quantity + $item->quantity]);
                    $item->delete(); // Remove duplicated from session cart
                } else {
                    // Re-assign item to user cart
                    $item->update(['cart_id' => $userCart->id]);
                }
            }
            $sessionCart->delete();
        }

        return response()->json(['message' => 'Cart merged', 'cart' => $userCart->load('items')]);
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
