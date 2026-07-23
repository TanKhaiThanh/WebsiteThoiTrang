<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Banner;

class BannerController extends Controller
{
    public function index(Request $request)
    {
        $query = Banner::query();
        if ($request->has('position')) {
            $query->where('position', $request->position);
        }
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }
        $query->orderBy('order', 'asc')->orderBy('created_at', 'desc');
        return response()->json(['data' => $query->get()]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'image_url' => 'required|string',
            'link_url' => 'nullable|string',
            'position' => 'required|in:hero,collection,footer',
            'is_active' => 'boolean',
            'order' => 'integer'
        ]);

        $banner = Banner::create($validated);
        return response()->json(['message' => 'Banner created', 'data' => $banner], 201);
    }

    public function update(Request $request, Banner $banner)
    {
        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'image_url' => 'nullable|string',
            'link_url' => 'nullable|string',
            'position' => 'nullable|in:hero,collection,footer',
            'is_active' => 'boolean',
            'order' => 'integer'
        ]);

        $banner->update($validated);
        return response()->json(['message' => 'Banner updated', 'data' => $banner]);
    }

    public function destroy(Banner $banner)
    {
        $banner->delete();
        return response()->json(['message' => 'Banner deleted']);
    }
}
