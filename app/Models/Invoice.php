<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_number',
        'user_id',
        'payment_id',
        'description',
        'amount',
        'tax',
        'total_amount',
        'issue_date',
        'due_date',
        'status',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'tax' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'issue_date' => 'date',
        'due_date' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }

    public function receipt()
    {
        return $this->hasOne(Receipt::class);
    }
}
