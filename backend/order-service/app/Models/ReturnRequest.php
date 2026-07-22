<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ReturnRequest extends Model
{
    protected $fillable = ['order_id', 'user_id', 'reason', 'proof_images', 'status', 'admin_note'];
    protected function casts(): array { return ['proof_images' => 'array']; }
    public function order() { return $this->belongsTo(Order::class); }
}
