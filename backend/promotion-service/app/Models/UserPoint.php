<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class UserPoint extends Model
{
    protected $fillable = ['user_id', 'balance', 'total_earned', 'total_spent'];
}
