<?php

namespace App\Http\Controllers;

use App\Models\Order;
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

        $totalOrders = Order::count();
        $totalRevenue = Order::where('status', 'delivered')->sum('total');
        
        $statuses = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled', 'returned'];
        $ordersByStatus = [];
        foreach ($statuses as $status) {
            $ordersByStatus[$status] = Order::where('status', $status)->count();
        }

        $recentOrders = Order::with('items')->orderBy('created_at', 'desc')->take(5)->get();

        $revenueByMonth = Order::where('status', 'delivered')
            ->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, SUM(total) as revenue')
            ->groupBy('month')
            ->orderBy('month', 'desc')
            ->take(6)
            ->get();

        return response()->json([
            'total_orders' => $totalOrders,
            'total_revenue' => $totalRevenue,
            'orders_by_status' => $ordersByStatus,
            'recent_orders' => $recentOrders,
            'revenue_by_month' => $revenueByMonth,
        ]);
    }
}
