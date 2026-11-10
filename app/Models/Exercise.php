<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Exercise extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'category',
        'target_muscle',
        'equipment',
        'description',
    ];

    public function planExercises()
    {
        return $this->hasMany(WorkoutPlanExercise::class);
    }
}
