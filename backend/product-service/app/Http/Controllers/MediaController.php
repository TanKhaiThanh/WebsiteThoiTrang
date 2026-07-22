<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MediaController extends Controller
{
    public function upload(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        $path = $request->file('image')->store('uploads/products', 'public');

        return response()->json([
            'message' => 'Upload successful',
            'url' => '/storage/' . $path,
        ]);
    }

    public function uploadMultiple(Request $request)
    {
        $request->validate([
            'images' => 'required|array|max:10',
            'images.*' => 'image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        $urls = [];
        foreach ($request->file('images') as $image) {
            $path = $image->store('uploads/products', 'public');
            $urls[] = '/storage/' . $path;
        }

        return response()->json(['message' => 'Upload successful', 'urls' => $urls]);
    }
}
