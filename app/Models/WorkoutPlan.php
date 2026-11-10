<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkoutPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'member_id',
        'trainer_id',
        'title',
        'objective',
        'description',
        'start_date',
        'end_date',
        'status',
        'structured_exercises',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'structured_exercises' => 'array',
    ];

    public function member()
    {
        return $this->belongsTo(User::class, 'member_id');
    }

    public function trainer()
    {
        return $this->belongsTo(User::class, 'trainer_id');
    }

    public function exercises()
    {
        return $this->hasMany(WorkoutPlanExercise::class)->orderBy('exercise_order');
    }

    public function sessions()
    {
        return $this->hasMany(WorkoutSession::class);
    }
}
