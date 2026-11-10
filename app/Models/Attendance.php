<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    use HasFactory;

    protected $table = 'attendance';

    protected $fillable = [
        'booking_id',
        'schedule_id',
        'user_id',
        'check_in_time',
        'status',
        'verified_by_user_id',
        'notes',
    ];

    protected $casts = [
        'check_in_time' => 'datetime',
    ];

    public function booking()
    {
        return $this->belongsTo(ClassBooking::class, 'booking_id');
    }

    public function schedule()
    {
        return $this->belongsTo(ClassSchedule::class, 'schedule_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function verifiedBy()
    {
        return $this->belongsTo(User::class, 'verified_by_user_id');
    }
}
