<?php

namespace App\Http\Controllers;

use App\Models\Inventory;
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
        $inventory = Inventory::where('variant_id', $variantId)->first();
        if (!$inventory) {
            return response()->json(['error' => 'Inventory not found'], 404);
        }

        $inventory->update(['available_qty' => $request->available_qty]);
        return response()->json(['message' => 'Stock updated', 'inventory' => $inventory]);
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
}
