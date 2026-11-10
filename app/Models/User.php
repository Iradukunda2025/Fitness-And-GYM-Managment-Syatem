<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'role',
        'status',
        'profile_picture',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isTrainer(): bool
    {
        return $this->role === 'trainer';
    }

    public function isMember(): bool
    {
        return $this->role === 'member';
    }

    public function memberProfile()
    {
        return $this->hasOne(MemberProfile::class);
    }

    public function trainerProfile()
    {
        return $this->hasOne(TrainerProfile::class);
    }

    public function trainerCertifications()
    {
        return $this->hasMany(TrainerCertification::class, 'trainer_id');
    }

    public function memberships()
    {
        return $this->hasMany(Membership::class);
    }

    public function activeMembership()
    {
        return $this->hasOne(Membership::class)->where('status', 'active')->where('expiry_date', '>=', now()->toDateString())->latest('id');
    }

    public function classBookings()
    {
        return $this->hasMany(ClassBooking::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    public function assignedMembers()
    {
        return $this->hasManyThrough(User::class, MemberProfile::class, 'assigned_trainer_id', 'id', 'id', 'user_id');
    }

    public function workoutPlans()
    {
        return $this->hasMany(WorkoutPlan::class, 'member_id');
    }

    public function trainerWorkoutPlans()
    {
        return $this->hasMany(WorkoutPlan::class, 'trainer_id');
    }

    public function workoutSessions()
    {
        return $this->hasMany(WorkoutSession::class);
    }

    public function fitnessMetrics()
    {
        return $this->hasMany(FitnessMetric::class)->orderBy('recorded_date', 'desc');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function receipts()
    {
        return $this->hasMany(Receipt::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class)->orderBy('created_at', 'desc');
    }

    public function disputes()
    {
        return $this->hasMany(Dispute::class);
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }
}
