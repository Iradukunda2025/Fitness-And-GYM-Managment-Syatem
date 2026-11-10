<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrainerProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'bio',
        'specialties',
        'years_of_experience',
        'qualifications',
        'availability_status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
