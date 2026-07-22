<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'order_number', 'user_id', 'status', 'subtotal',
        'voucher_discount', 'shipping_discount', 'points_discount',
        'shipping_fee', 'total', 'customer_name', 'customer_phone',
        'shipping_address', 'payment_method', 'payment_status', 'note',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:0',
            'total' => 'decimal:0',
        ];
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }

    public function returnRequest()
    {
        return $this->hasOne(ReturnRequest::class);
    }

    public function shipment()
    {
        return $this->hasOne(Shipment::class);
    }
}
