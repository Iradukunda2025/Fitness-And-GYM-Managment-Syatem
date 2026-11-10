<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClassBooking extends Model
{
    use HasFactory;

    protected $fillable = [
        'schedule_id',
        'user_id',
        'booking_reference',
        'status',
        'booked_at',
        'cancelled_at',
    ];

    protected $casts = [
        'booked_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    public function schedule()
    {
        return $this->belongsTo(ClassSchedule::class, 'schedule_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function attendance()
    {
        return $this->hasOne(Attendance::class, 'booking_id');
    }
}
