<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MembershipRenewal extends Model
{
    use HasFactory;

    protected $fillable = [
        'membership_id',
        'user_id',
        'previous_expiry_date',
        'new_expiry_date',
        'amount_paid',
        'payment_id',
        'renewal_date',
        'notes',
    ];

    protected $casts = [
        'previous_expiry_date' => 'date',
        'new_expiry_date' => 'date',
        'renewal_date' => 'datetime',
        'amount_paid' => 'decimal:2',
    ];

    public function membership()
    {
        return $this->belongsTo(Membership::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }
}
