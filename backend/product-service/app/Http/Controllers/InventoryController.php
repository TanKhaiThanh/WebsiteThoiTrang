<?php

namespace App\Http\Controllers;

use App\Models\Inventory;
use App\Models\InventoryTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    public function show($variantId)
    {
        $inventory = Inventory::where('variant_id', $variantId)->first();
        if (!$inventory) {
            return response()->json(['error' => 'Inventory not found'], 404);
        }
        return response()->json(['inventory' => $inventory]);
    }

    public function update(Request $request, $variantId)
    {
        $request->validate([
            'type' => 'required|in:in,out',
            'quantity' => 'required|integer|min:1',
            'note' => 'nullable|string'
        ]);

        DB::beginTransaction();
        try {
            $inventory = Inventory::where('variant_id', $variantId)->lockForUpdate()->first();
            if (!$inventory) {
                return response()->json(['error' => 'Inventory not found'], 404);
            }

            $currentQty = $inventory->available_qty;
            $qtyChanged = $request->quantity;
            
            if ($request->type === 'out') {
                if ($currentQty < $qtyChanged) {
                    DB::rollBack();
                    return response()->json(['error' => 'Không đủ số lượng trong kho'], 400);
                }
                $newQty = $currentQty - $qtyChanged;
            } else {
                $newQty = $currentQty + $qtyChanged;
            }

            $inventory->update(['available_qty' => $newQty]);

            InventoryTransaction::create([
                'variant_id' => $variantId,
                'type' => $request->type,
                'quantity_changed' => $qtyChanged,
                'balance_after' => $newQty,
                'note' => $request->note,
                'user_name' => 'Admin'
            ]);

            DB::commit();
            return response()->json(['message' => 'Stock updated', 'inventory' => $inventory]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function transactions($variantId)
    {
        $transactions = InventoryTransaction::where('variant_id', $variantId)
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json(['data' => $transactions]);
    }

    /**
     * Reserve stock (atomic operation for order creation)
     */
    public function reserve(Request $request)
    {
        $items = $request->input('items', []);
        $reserved = [];

        DB::beginTransaction();
        try {
            foreach ($items as $item) {
                $variant = DB::table('product_variants')
                    ->join('products', 'products.id', '=', 'product_variants.product_id')
                    ->select('product_variants.price_override', 'products.price', 'products.sale_price')
                    ->where('product_variants.id', $item['variant_id'])
                    ->first();

                if (!$variant) continue;

                $updated = Inventory::where('variant_id', $item['variant_id'])
                    ->where('available_qty', '>=', $item['qty'])
                    ->update([
                        'available_qty' => DB::raw("available_qty - {$item['qty']}"),
                        'reserved_qty' => DB::raw("reserved_qty + {$item['qty']}"),
                    ]);

                if (!$updated) {
                    DB::rollBack();
                    return response()->json([
                        'error' => 'Insufficient stock',
                        'variant_id' => $item['variant_id'],
                    ], 409);
                }
                
                $item['verified_price'] = $variant->price_override ?? ($variant->sale_price ?? $variant->price);
                $reserved[] = $item;
            }
            DB::commit();
            return response()->json(['message' => 'Stock reserved', 'reserved' => $reserved]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Reserve failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Release reserved stock (order cancelled)
     */
    public function release(Request $request)
    {
        $items = $request->input('items', []);

        foreach ($items as $item) {
            Inventory::where('variant_id', $item['variant_id'])
                ->update([
                    'available_qty' => DB::raw("available_qty + {$item['qty']}"),
                    'reserved_qty' => DB::raw("GREATEST(reserved_qty - {$item['qty']}, 0)"),
                ]);
        }

        return response()->json(['message' => 'Stock released']);
    }

    /**
     * Finalize reserved stock (order delivered)
     */
    public function finalize(Request $request)
    {
        $items = $request->input('items', []);

        foreach ($items as $item) {
            Inventory::where('variant_id', $item['variant_id'])
                ->update([
                    'reserved_qty' => DB::raw("GREATEST(reserved_qty - {$item['qty']}, 0)")
                ]);
        }

        return response()->json(['message' => 'Stock finalized']);
    }
}
