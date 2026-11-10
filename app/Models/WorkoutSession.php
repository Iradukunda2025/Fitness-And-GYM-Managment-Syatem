<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkoutSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'workout_plan_id',
        'session_date',
        'start_time',
        'end_time',
        'duration_minutes',
        'status',
        'notes',
    ];

    protected $casts = [
        'session_date' => 'date',
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function workoutPlan()
    {
        return $this->belongsTo(WorkoutPlan::class);
    }

    public function exercises()
    {
        return $this->hasMany(WorkoutSessionExercise::class);
    }
}
