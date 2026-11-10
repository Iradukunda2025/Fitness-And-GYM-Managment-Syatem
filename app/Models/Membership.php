<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Membership extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'membership_plan_id',
        'start_date',
        'expiry_date',
        'status',
        'auto_renew',
    ];

    protected $casts = [
        'start_date' => 'date',
        'expiry_date' => 'date',
        'auto_renew' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function plan()
    {
        return $this->belongsTo(MembershipPlan::class, 'membership_plan_id');
    }

    public function renewals()
    {
        return $this->hasMany(MembershipRenewal::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active' && $this->expiry_date->isFuture();
    }
}
