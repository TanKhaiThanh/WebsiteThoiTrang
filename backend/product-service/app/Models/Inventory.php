<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    protected $table = 'inventory';

    protected $fillable = ['variant_id', 'available_qty', 'reserved_qty'];

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }

    public function getTotalQtyAttribute(): int
    {
        return $this->available_qty + $this->reserved_qty;
    }
}
