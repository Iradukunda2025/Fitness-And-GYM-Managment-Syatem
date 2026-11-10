<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClassCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'icon',
    ];

    public function classes()
    {
        return $this->hasMany(GymClass::class, 'category_id');
    }
}
