<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'name_product',
        'description',
        'price',
        'stock',
        'image'
    ];
}