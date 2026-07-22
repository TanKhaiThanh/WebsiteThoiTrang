<?php

namespace App\Http\Controllers;

use App\Models\UserPoint;
use App\Models\PointTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PointController extends Controller
{
    public function show(Request $request, $userId)
    {
        $points = UserPoint::firstOrCreate(
            ['user_id' => $userId],
            ['balance' => 0, 'total_earned' => 0, 'total_spent' => 0]
        );

        $history = PointTransaction::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        return response()->json(['points' => $points, 'history' => $history]);
    }

    /**
     * Earn points (called when order delivered)
     * Rule: 1,000 VND = 1 point
     */
    public function earn(Request $request)
    {
        $request->validate([
            'user_id' => 'required|integer',
            'order_id' => 'required|integer',
            'order_total' => 'required|numeric|min:0',
        ]);

        $earnedPoints = (int) floor($request->order_total / 1000);

        DB::transaction(function () use ($request, $earnedPoints) {
            $userPoint = UserPoint::firstOrCreate(
                ['user_id' => $request->user_id],
                ['balance' => 0, 'total_earned' => 0, 'total_spent' => 0]
            );

            $userPoint->increment('balance', $earnedPoints);
            $userPoint->increment('total_earned', $earnedPoints);

            PointTransaction::create([
                'user_id' => $request->user_id,
                'amount' => $earnedPoints,
                'type' => 'earn',
                'description' => "Earned from order #{$request->order_id}",
                'order_id' => $request->order_id,
            ]);
        });

        return response()->json(['message' => "Earned {$earnedPoints} points"]);
    }

    /**
     * Redeem points for discount
     * Rule: 1 point = 1,000 VND discount
     */
    public function redeem(Request $request)
    {
        $request->validate([
            'points' => 'required|integer|min:1',
        ]);

        $userId = $request->input('auth_user_id');
        $userPoint = UserPoint::where('user_id', $userId)->first();

        if (!$userPoint || $userPoint->balance < $request->points) {
            return response()->json(['error' => 'Insufficient points'], 422);
        }

        $discount = $request->points * 1000; // 1 point = 1,000 VND

        DB::transaction(function () use ($userId, $request, $userPoint) {
            $userPoint->decrement('balance', $request->points);
            $userPoint->increment('total_spent', $request->points);

            PointTransaction::create([
                'user_id' => $userId,
                'amount' => -$request->points,
                'type' => 'redeem',
                'description' => "Redeemed {$request->points} points",
            ]);
        });

        return response()->json([
            'message' => 'Points redeemed',
            'discount' => $discount,
            'remaining_balance' => $userPoint->fresh()->balance,
        ]);
    }
}
