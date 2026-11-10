<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FitnessMetric extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'recorded_date',
        'weight_kg',
        'height_cm',
        'bmi',
        'body_fat_percentage',
        'chest_cm',
        'waist_cm',
        'arms_cm',
        'workout_frequency_weekly',
        'notes',
    ];

    protected $casts = [
        'recorded_date' => 'date',
        'weight_kg' => 'decimal:2',
        'height_cm' => 'decimal:2',
        'bmi' => 'decimal:1',
    ];

    public static function calculateBMI(float $weightKg, float $heightCm): float
    {
        if ($heightCm <= 0) return 0;
        $heightM = $heightCm / 100;
        return round($weightKg / ($heightM * $heightM), 1);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
