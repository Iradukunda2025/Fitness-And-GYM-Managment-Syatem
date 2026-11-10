<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkoutSessionExercise extends Model
{
    use HasFactory;

    protected $fillable = [
        'workout_session_id',
        'exercise_name',
        'sets_completed',
        'reps_completed',
        'weight_used_kg',
        'notes',
    ];

    public function workoutSession()
    {
        return $this->belongsTo(WorkoutSession::class);
    }
}
