<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Review;

class ReviewController extends Controller
{
    public function index(Request $request)
    {
        $query = Review::with('product:id,name');
        
        if ($request->has('product_id')) {
            $query->where('product_id', $request->product_id);
        }
        if ($request->has('is_approved')) {
            $query->where('is_approved', $request->boolean('is_approved'));
        }
        
        return response()->json($query->orderBy('created_at', 'desc')->paginate(20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000'
        ]);
        
        $userId = $request->header('X-User-Id') ?? $request->user_id ?? 1; // Fallback to 1 if not passed correctly
        $validated['user_id'] = $userId;
        $validated['is_approved'] = false;
        
        $review = Review::create($validated);
        return response()->json(['message' => 'Review submitted successfully. Wait for admin approval.', 'data' => $review], 201);
    }

    public function approve(Review $review)
    {
        $review->update(['is_approved' => true]);
        return response()->json(['message' => 'Review approved', 'data' => $review]);
    }

    public function destroy(Review $review)
    {
        $review->delete();
        return response()->json(['message' => 'Review deleted']);
    }
}
