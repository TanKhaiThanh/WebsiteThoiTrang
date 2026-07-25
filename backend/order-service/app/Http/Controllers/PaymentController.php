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

        $vnp_TmnCode = 'JNRTV9RY';
        $vnp_HashSecret = 'EMKCOWQQYEGXMESTDPEWLTBFNLYIQBSQ';
        $vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
        $vnp_ReturnUrl = "http://localhost:3000/payment/callback";

        date_default_timezone_set('Asia/Ho_Chi_Minh');

        $inputData = [
            'vnp_Version' => '2.1.0',
            'vnp_TmnCode' => $vnp_TmnCode,
            'vnp_Amount' => $order->total * 100,
            'vnp_Command' => 'pay',
            'vnp_CreateDate' => date('YmdHis'),
            'vnp_ExpireDate' => date('YmdHis', strtotime('+15 minutes')),
            'vnp_CurrCode' => 'VND',
            'vnp_IpAddr' => $request->ip(),
            'vnp_Locale' => 'vn',
            'vnp_OrderInfo' => 'Thanh_toan_don_hang_' . $order->order_number,
            'vnp_OrderType' => 'fashion',
            'vnp_ReturnUrl' => $vnp_ReturnUrl,
            'vnp_TxnRef' => $order->order_number . '_' . time(),
        ];

        ksort($inputData);
        $query = "";
        $i = 0;
        $hashdata = "";
        foreach ($inputData as $key => $value) {
            if ($i == 1) {
                $hashdata .= '&' . urlencode($key) . "=" . urlencode($value);
            } else {
                $hashdata .= urlencode($key) . "=" . urlencode($value);
                $i = 1;
            }
            $query .= urlencode($key) . "=" . urlencode($value) . '&';
        }

        $vnp_Url = $vnp_Url . "?" . $query;
        if (isset($vnp_HashSecret)) {
            $vnpSecureHash =   hash_hmac('sha512', $hashdata, $vnp_HashSecret);
            $vnp_Url .= 'vnp_SecureHash=' . $vnpSecureHash;
        }

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
        $vnp_HashSecret = 'EMKCOWQQYEGXMESTDPEWLTBFNLYIQBSQ';
        $inputData = $request->all();
        $vnp_SecureHash = $inputData['vnp_SecureHash'] ?? '';

        unset($inputData['vnp_SecureHash'], $inputData['vnp_SecureHashType']);
        ksort($inputData);
        $i = 0;
        $hashData = "";
        foreach ($inputData as $key => $value) {
            if ($i == 1) {
                $hashData = $hashData . '&' . urlencode($key) . "=" . urlencode($value);
            } else {
                $hashData = $hashData . urlencode($key) . "=" . urlencode($value);
                $i = 1;
            }
        }
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
