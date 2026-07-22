<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Shipment extends Model
{
    protected $fillable = ['order_id', 'shipper_id', 'tracking_number', 'status', 'delivered_at', 'note'];
    protected function casts(): array { return ['delivered_at' => 'datetime']; }
    public function order() { return $this->belongsTo(Order::class); }
}
