<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GymClass extends Model
{
    use HasFactory;

    protected $table = 'classes';

    protected $fillable = [
        'category_id',
        'trainer_id',
        'title',
        'description',
        'capacity',
        'duration_minutes',
        'room_location',
        'is_active',
    ];

    protected $casts = [
        'capacity' => 'integer',
        'duration_minutes' => 'integer',
        'is_active' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(ClassCategory::class, 'category_id');
    }

    public function trainer()
    {
        return $this->belongsTo(User::class, 'trainer_id');
    }

    public function schedules()
    {
        return $this->hasMany(ClassSchedule::class, 'class_id');
    }
}
