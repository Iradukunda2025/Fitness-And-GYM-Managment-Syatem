<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MembershipPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'duration_months',
        'price',
        'included_services',
        'access_conditions',
        'is_active',
    ];

    protected $casts = [
        'included_services' => 'array',
        'price' => 'decimal:2',
        'is_active' => 'boolean',
        'duration_months' => 'integer',
    ];

    public function memberships()
    {
        return $this->hasMany(Membership::class);
    }
}
