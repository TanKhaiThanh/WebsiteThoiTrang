<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Order;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    /**
     * Create VNPay payment URL
     */
    public function create(Request $request)
    {
        $request->validate(['order_id' => 'required|exists:orders,id']);

        $order = Order::find($request->order_id);

        $vnp_TmnCode = env('VNPAY_TMN_CODE', 'DEMO1234');
        $vnp_HashSecret = env('VNPAY_HASH_SECRET', 'DEMOSECRETKEY');
        $vnp_Url = env('VNPAY_URL', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html');
        $vnp_ReturnUrl = env('VNPAY_RETURN_URL', 'http://localhost:3000/payment/callback');

        $inputData = [
            'vnp_Version' => '2.1.0',
            'vnp_TmnCode' => $vnp_TmnCode,
            'vnp_Amount' => $order->total * 100,
            'vnp_Command' => 'pay',
            'vnp_CreateDate' => date('YmdHis'),
            'vnp_CurrCode' => 'VND',
            'vnp_IpAddr' => $request->ip(),
            'vnp_Locale' => 'vn',
            'vnp_OrderInfo' => 'Thanh toan don hang ' . $order->order_number,
            'vnp_OrderType' => 'fashion',
            'vnp_ReturnUrl' => $vnp_ReturnUrl,
            'vnp_TxnRef' => $order->order_number . '_' . time(),
        ];

        ksort($inputData);
        $query = http_build_query($inputData);
        $hashdata = $query;
        $vnpSecureHash = hash_hmac('sha512', $hashdata, $vnp_HashSecret);
        $vnp_Url .= '?' . $query . '&vnp_SecureHash=' . $vnpSecureHash;

        // Record payment attempt
        Payment::create([
            'order_id' => $order->id,
            'method' => 'vnpay',
            'amount' => $order->total,
            'status' => 'pending',
        ]);

        return response()->json(['payment_url' => $vnp_Url]);
    }

    /**
     * VNPay callback (IPN)
     */
    public function callback(Request $request)
    {
        $vnp_HashSecret = env('VNPAY_HASH_SECRET', 'DEMOSECRETKEY');
        $inputData = $request->all();
        $vnp_SecureHash = $inputData['vnp_SecureHash'] ?? '';

        unset($inputData['vnp_SecureHash'], $inputData['vnp_SecureHashType']);
        ksort($inputData);
        $hashData = http_build_query($inputData);
        $secureHash = hash_hmac('sha512', $hashData, $vnp_HashSecret);

        if ($secureHash !== $vnp_SecureHash) {
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        $txnRef = explode('_', $inputData['vnp_TxnRef'])[0];
        $order = Order::where('order_number', $txnRef)->first();

        if (!$order) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        $responseCode = $inputData['vnp_ResponseCode'] ?? '99';

        if ($responseCode === '00') {
            $order->update(['payment_status' => 'paid', 'status' => 'confirmed']);
            Payment::where('order_id', $order->id)->update([
                'status' => 'success',
                'transaction_id' => $inputData['vnp_TransactionNo'] ?? null,
                'gateway_response' => $inputData,
            ]);
        } else {
            Payment::where('order_id', $order->id)->update([
                'status' => 'failed',
                'gateway_response' => $inputData,
            ]);
        }

        return response()->json([
            'success' => $responseCode === '00',
            'order' => $order->fresh(),
        ]);
    }
}
