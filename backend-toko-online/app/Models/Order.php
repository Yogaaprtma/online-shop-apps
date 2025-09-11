<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{   
    protected $fillable = [
        'user_id',
        'order_code',
        'total',
        'status',
        'payment_proof',
        'payment_method',
        'payment_date',
        'snap_token',
        'midtrans_transaction_id',
        'payment_type',
    ];

    protected $casts = [
        'total' => 'decimal:2',
        'payment_date' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}