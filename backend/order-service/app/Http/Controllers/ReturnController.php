<?php

namespace App\Http\Controllers;

use App\Models\ReturnRequest;
use Illuminate\Http\Request;

class ReturnController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'order_id' => 'required|exists:orders,id',
            'reason' => 'required|string',
            'proof_images' => 'nullable|array',
        ]);

        $return = ReturnRequest::create([
            'order_id' => $request->order_id,
            'user_id' => $request->input('auth_user_id'),
            'reason' => $request->reason,
            'proof_images' => $request->proof_images,
        ]);

        return response()->json(['message' => 'Return request created', 'return' => $return], 201);
    }

    public function index(Request $request)
    {
        $query = ReturnRequest::with('order');
        $role = $request->input('auth_user_role');

        if (!in_array($role, ['admin', 'staff'])) {
            $query->where('user_id', $request->input('auth_user_id'));
        }

        return response()->json($query->orderBy('created_at', 'desc')->paginate(15));
    }

    public function approve(Request $request, $id)
    {
        $return = ReturnRequest::find($id);
        if (!$return) return response()->json(['error' => 'Not found'], 404);

        $return->update([
            'status' => 'approved',
            'admin_note' => $request->admin_note,
        ]);

        $return->order->update(['status' => 'returned', 'payment_status' => 'refunded']);

        return response()->json(['message' => 'Return approved', 'return' => $return]);
    }

    public function reject(Request $request, $id)
    {
        $return = ReturnRequest::find($id);
        if (!$return) return response()->json(['error' => 'Not found'], 404);

        $return->update(['status' => 'rejected', 'admin_note' => $request->admin_note]);
        return response()->json(['message' => 'Return rejected', 'return' => $return]);
    }
}
