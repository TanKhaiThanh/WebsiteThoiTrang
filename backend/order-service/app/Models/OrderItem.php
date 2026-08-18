<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    protected $fillable = ['order_id', 'product_id', 'variant_id', 'product_name', 'variant_info', 'quantity', 'price'];
    protected $appends = ['product_image'];

    public function order() { return $this->belongsTo(Order::class); }

    public function getProductImageAttribute()
    {
        return \Illuminate\Support\Facades\DB::table('product_images')
            ->where('product_id', $this->product_id)
            ->orderByDesc('is_primary')
            ->value('url');
    }
}
