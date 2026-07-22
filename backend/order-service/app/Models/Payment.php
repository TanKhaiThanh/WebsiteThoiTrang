<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = ['order_id', 'method', 'transaction_id', 'amount', 'status', 'gateway_response'];
    protected function casts(): array { return ['gateway_response' => 'array']; }
    public function order() { return $this->belongsTo(Order::class); }
}
