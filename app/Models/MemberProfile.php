<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MemberProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'date_of_birth',
        'gender',
        'address',
        'emergency_contact_name',
        'emergency_contact_phone',
        'emergency_contact_relation',
        'fitness_goals',
        'health_notes',
        'assigned_trainer_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function assignedTrainer()
    {
        return $this->belongsTo(User::class, 'assigned_trainer_id');
    }
}
