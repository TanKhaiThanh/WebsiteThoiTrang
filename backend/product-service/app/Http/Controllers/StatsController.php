<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use App\Models\Inventory;
use Illuminate\Http\Request;

class StatsController extends Controller
{
    public function index(Request $request)
    {
        // Admin or Staff role required
        $role = $request->input('auth_user_role');
        if (!in_array($role, ['admin', 'staff'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $totalProducts = Product::count();
        $totalCategories = Category::count();
        
        $lowStockVariants = Inventory::where('available_qty', '<', 10)->count();

        return response()->json([
            'total_products' => $totalProducts,
            'total_categories' => $totalCategories,
            'low_stock_variants' => $lowStockVariants,
        ]);
    }
}
