<?php

namespace App\Services;

use App\Models\ClassBooking;
use App\Models\FraudFlag;
use App\Models\Membership;
use App\Models\Payment;
use App\Models\User;

class FraudDetectionService
{
    /**
     * Check for multiple active subscriptions in the same period
     */
    public static function checkMultipleActiveSubscriptions(int $userId): ?FraudFlag
    {
        $activeCount = Membership::where('user_id', $userId)
            ->where('status', 'active')
            ->where('expiry_date', '>=', now()->toDateString())
            ->count();

        if ($activeCount > 1) {
            return FraudFlag::create([
                'user_id' => $userId,
                'flag_type' => 'multiple_active_subscriptions',
                'severity' => 'high',
                'description' => "User has {$activeCount} concurrent active memberships in overlapping periods.",
                'metadata' => ['user_id' => $userId, 'active_count' => $activeCount],
                'status' => 'flagged',
            ]);
        }

        return null;
    }

    /**
     * Check duplicate booking attempt for the same session
     */
    public static function checkDuplicateBooking(int $userId, int $scheduleId): ?FraudFlag
    {
        $existing = ClassBooking::where('user_id', $userId)
            ->where('schedule_id', $scheduleId)
            ->whereIn('status', ['confirmed', 'attended'])
            ->exists();

        if ($existing) {
            return FraudFlag::create([
                'user_id' => $userId,
                'flag_type' => 'duplicate_class_booking',
                'severity' => 'medium',
                'description' => "User attempted to create a duplicate active booking for class schedule ID {$scheduleId}.",
                'metadata' => ['user_id' => $userId, 'schedule_id' => $scheduleId],
                'status' => 'flagged',
            ]);
        }

        return null;
    }

    /**
     * Check invalid check-in attempts
     */
    public static function flagInvalidCheckIn(int $userId, int $scheduleId, string $reason): FraudFlag
    {
        return FraudFlag::create([
            'user_id' => $userId,
            'flag_type' => 'repeated_invalid_checkin',
            'severity' => 'low',
            'description' => "Invalid check-in attempt for schedule ID {$scheduleId}. Reason: {$reason}",
            'metadata' => ['user_id' => $userId, 'schedule_id' => $scheduleId, 'reason' => $reason],
            'status' => 'flagged',
        ]);
    }

    /**
     * Check suspicious payment reference
     */
    public static function checkSuspiciousPayment(string $paymentRef, float $amount, ?int $userId = null): ?FraudFlag
    {
        $existing = Payment::where('payment_reference', $paymentRef)->exists();
        if ($existing) {
            return FraudFlag::create([
                'user_id' => $userId,
                'flag_type' => 'suspicious_payment_reference',
                'severity' => 'critical',
                'description' => "Duplicate payment reference '{$paymentRef}' submitted for amount \${$amount}.",
                'metadata' => ['payment_reference' => $paymentRef, 'amount' => $amount],
                'status' => 'flagged',
            ]);
        }

        return null;
    }
}
