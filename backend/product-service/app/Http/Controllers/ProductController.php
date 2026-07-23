<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ProductImage;
use App\Models\Inventory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['category', 'primaryImage', 'variants.inventory'])
            ->where('is_active', true);

        // Filter by category
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('brand', 'like', "%{$search}%");
            });
        }

        // Price range
        if ($request->has('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }
        if ($request->has('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }

        // Filter by variants (sizes and colors)
        if ($request->has('sizes')) {
            $sizes = is_array($request->sizes) ? $request->sizes : explode(',', $request->sizes);
            $query->whereHas('variants', function ($q) use ($sizes) {
                $q->whereIn('size', $sizes);
            });
        }
        if ($request->has('colors')) {
            $colors = is_array($request->colors) ? $request->colors : explode(',', $request->colors);
            $query->whereHas('variants', function ($q) use ($colors) {
                $q->whereIn('color', $colors);
            });
        }

        // Featured
        if ($request->boolean('featured')) {
            $query->where('is_featured', true);
        }

        // Sort
        $sortBy = $request->get('sort', 'created_at');
        $sortDir = $request->get('order', 'desc');
        $query->orderBy($sortBy, $sortDir);

        return response()->json($query->paginate($request->get('per_page', 12)));
    }

    public function adminIndex(Request $request)
    {
        $query = Product::with(['category', 'primaryImage', 'variants.inventory']);

        // Filter by category
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('brand', 'like', "%{$search}%");
            });
        }

        // Sort
        $sortBy = $request->get('sort', 'created_at');
        $sortDir = $request->get('order', 'desc');
        $query->orderBy($sortBy, $sortDir);

        return response()->json($query->paginate($request->get('per_page', 12)));
    }

    public function show($id)
    {
        $product = Product::with(['category', 'images', 'variants.inventory'])->find($id);

        if (!$product) {
            return response()->json(['error' => 'Product not found'], 404);
        }

        $product->increment('view_count');

        return response()->json(['product' => $product]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'sale_price' => 'nullable|numeric|min:0',
            'category_id' => 'required|exists:categories,id',
            'brand' => 'nullable|string|max:100',
            'material' => 'nullable|string|max:100',
            'variants' => 'nullable|array',
            'variants.*.color' => 'required_with:variants|string',
            'variants.*.size' => 'required_with:variants|string',
            'variants.*.sku' => 'required_with:variants|string|unique:product_variants,sku',
            'variants.*.qty' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $product = Product::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name) . '-' . Str::random(5),
            'description' => $request->description,
            'price' => $request->price,
            'sale_price' => $request->sale_price,
            'category_id' => $request->category_id,
            'brand' => $request->brand,
            'material' => $request->material,
        ]);

        // Create variants + inventory
        if ($request->has('variants')) {
            foreach ($request->variants as $v) {
                $variant = $product->variants()->create([
                    'color' => $v['color'],
                    'size' => $v['size'],
                    'sku' => $v['sku'],
                    'price_override' => $v['price_override'] ?? null,
                ]);
                Inventory::create([
                    'variant_id' => $variant->id,
                    'available_qty' => $v['qty'] ?? 0,
                ]);
            }
        }

        // Create images
        if ($request->has('images') && is_array($request->images)) {
            foreach ($request->images as $img) {
                $product->images()->create([
                    'url' => $img['url'],
                    'color' => $img['color'] ?? null,
                    'is_primary' => filter_var($img['is_primary'] ?? false, FILTER_VALIDATE_BOOLEAN),
                    'sort_order' => $img['sort_order'] ?? 0,
                ]);
            }
        }

        return response()->json([
            'message' => 'Product created',
            'product' => $product->load(['variants.inventory', 'images']),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['error' => 'Product not found'], 404);
        }

        $product->update($request->only([
            'name', 'description', 'price', 'sale_price',
            'category_id', 'brand', 'material', 'is_active', 'is_featured',
        ]));

        if ($request->has('name') && !$request->has('slug')) {
            $product->update(['slug' => Str::slug($request->name) . '-' . Str::random(5)]);
        }

        return response()->json([
            'message' => 'Product updated',
            'product' => $product->load(['variants.inventory', 'images', 'category']),
        ]);
    }

    public function destroy($id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['error' => 'Product not found'], 404);
        }

        $product->delete();
        return response()->json(['message' => 'Product deleted']);
    }

    public function getFilters()
    {
        $sizes = \App\Models\ProductVariant::whereNotNull('size')
            ->distinct()
            ->orderBy('size')
            ->pluck('size');

        $colors = \App\Models\ProductVariant::whereNotNull('color')
            ->distinct()
            ->orderBy('color')
            ->pluck('color');

        return response()->json([
            'sizes' => $sizes,
            'colors' => $colors,
        ]);
    }
}
