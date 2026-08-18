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
        $productDb = env('DB_PRODUCT_DATABASE', 'product_db');
        return \Illuminate\Support\Facades\DB::table($productDb . '.product_images')
            ->where('product_id', $this->product_id)
            ->orderByDesc('is_primary')
            ->value('url');
    }
}
