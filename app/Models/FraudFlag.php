<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FraudFlag extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'flag_type',
        'severity',
        'description',
        'metadata',
        'status',
        'reviewed_by_user_id',
        'investigation_notes',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }
}
