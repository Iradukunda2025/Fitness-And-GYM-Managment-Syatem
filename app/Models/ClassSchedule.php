<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClassSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'class_id',
        'trainer_id',
        'session_date',
        'start_time',
        'end_time',
        'max_capacity',
        'status',
    ];

    protected $casts = [
        'session_date' => 'date',
        'max_capacity' => 'integer',
    ];

    public function gymClass()
    {
        return $this->belongsTo(GymClass::class, 'class_id');
    }

    public function trainer()
    {
        return $this->belongsTo(User::class, 'trainer_id');
    }

    public function bookings()
    {
        return $this->hasMany(ClassBooking::class, 'schedule_id');
    }

    public function confirmedBookings()
    {
        return $this->hasMany(ClassBooking::class, 'schedule_id')->where('status', 'confirmed');
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class, 'schedule_id');
    }

    public function availableSpaces(): int
    {
        $booked = $this->confirmedBookings()->count();
        return max(0, $this->max_capacity - $booked);
    }
}
