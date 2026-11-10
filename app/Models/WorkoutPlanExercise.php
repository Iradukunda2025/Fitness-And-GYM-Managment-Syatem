<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkoutPlanExercise extends Model
{
    use HasFactory;

    protected $fillable = [
        'workout_plan_id',
        'exercise_id',
        'exercise_name',
        'target_muscle',
        'sets',
        'repetitions',
        'rest_period_seconds',
        'scheduled_day',
        'exercise_order',
        'trainer_instructions',
    ];

    public function workoutPlan()
    {
        return $this->belongsTo(WorkoutPlan::class);
    }

    public function exercise()
    {
        return $this->belongsTo(Exercise::class);
    }
}
