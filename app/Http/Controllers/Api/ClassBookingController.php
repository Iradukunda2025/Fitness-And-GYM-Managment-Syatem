<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassBooking;
use App\Models\ClassSchedule;
use App\Models\Notification;
use App\Services\AuditService;
use App\Services\FraudDetectionService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ClassBookingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = ClassBooking::with([
            'schedule.gymClass.category',
            'schedule.trainer.trainerProfile',
            'user.memberProfile',
            'attendance',
        ]);

        if ($user->isMember()) {
            $query->where('user_id', $user->id);
        } elseif ($user->isTrainer()) {
            $query->whereHas('schedule', fn($q) => $q->where('trainer_id', $user->id));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('schedule_id')) {
            $query->where('schedule_id', $request->schedule_id);
        }

        if ($request->boolean('upcoming', false)) {
            $query->whereHas('schedule', function ($q) {
                $q->whereDate('session_date', '>=', now()->toDateString());
            });
        }

        $bookings = $query->latest('id')->paginate($request->get('per_page', 15));
        return response()->json($bookings);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'schedule_id' => 'required|exists:class_schedules,id',
            'user_id' => 'nullable|exists:users,id', // For admin booking on behalf of member
        ]);

        $currentUser = $request->user();
        $targetUserId = ($currentUser->isAdmin() && !empty($validated['user_id']))
            ? $validated['user_id']
            : $currentUser->id;

        // 1. Verify Active Membership
        $hasActiveMembership = DB::table('memberships')
            ->where('user_id', $targetUserId)
            ->where('status', 'active')
            ->where('expiry_date', '>=', Carbon::today()->toDateString())
            ->exists();

        if (!$hasActiveMembership && !$currentUser->isAdmin()) {
            return response()->json([
                'message' => 'Active membership required to book classes. Please purchase or renew your membership subscription.'
            ], 403);
        }

        // 2. Concurrency Safe Booking Transaction
        $booking = DB::transaction(function () use ($validated, $targetUserId, $currentUser) {
            $schedule = ClassSchedule::where('id', $validated['schedule_id'])
                ->lockForUpdate()
                ->firstOrFail();

            if ($schedule->status === 'cancelled') {
                return response()->json(['message' => 'This class session has been cancelled.'], 422);
            }

            if ($schedule->session_date->isPast() && !$schedule->session_date->isToday()) {
                return response()->json(['message' => 'Cannot book a past class session.'], 422);
            }

            // Check Duplicate Booking
            $existing = ClassBooking::where('schedule_id', $schedule->id)
                ->where('user_id', $targetUserId)
                ->whereIn('status', ['confirmed', 'attended'])
                ->first();

            if ($existing) {
                FraudDetectionService::checkDuplicateBooking($targetUserId, $schedule->id);
                return response()->json([
                    'message' => 'You already have an active booking for this session.'
                ], 422);
            }

            // Check Capacity
            $currentBookedCount = ClassBooking::where('schedule_id', $schedule->id)
                ->where('status', 'confirmed')
                ->count();

            if ($currentBookedCount >= $schedule->max_capacity) {
                return response()->json([
                    'message' => 'Class is fully booked. Maximum capacity reached.'
                ], 422);
            }

            $ref = 'BK-' . strtoupper(Str::random(8));

            $newBooking = ClassBooking::create([
                'schedule_id' => $schedule->id,
                'user_id' => $targetUserId,
                'booking_reference' => $ref,
                'status' => 'confirmed',
                'booked_at' => Carbon::now(),
            ]);

            // Notification
            Notification::create([
                'user_id' => $targetUserId,
                'title' => 'Class Booking Confirmed!',
                'message' => "Your reservation for '{$schedule->gymClass->title}' on {$schedule->session_date->toDateString()} at {$schedule->start_time} is confirmed. Ref: {$ref}",
                'type' => 'booking',
                'link_url' => "/bookings/{$newBooking->id}",
            ]);

            AuditService::log($currentUser->id, 'create_booking', 'ClassBooking', $newBooking->id, [
                'reference' => $ref,
                'schedule_id' => $schedule->id,
            ]);

            return $newBooking;
        });

        // If returned JsonResponse directly from transaction error
        if ($booking instanceof JsonResponse) {
            return $booking;
        }

        return response()->json([
            'message' => 'Class booked successfully!',
            'booking' => $booking->load(['schedule.gymClass.category', 'schedule.trainer']),
        ], 201);
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $booking = ClassBooking::with('schedule.gymClass')->findOrFail($id);
        $user = $request->user();

        if ($user->isMember() && $booking->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($booking->status === 'cancelled') {
            return response()->json(['message' => 'Booking is already cancelled.'], 422);
        }

        if ($booking->status === 'attended') {
            return response()->json(['message' => 'Cannot cancel a session that has already been attended.'], 422);
        }

        $booking->update([
            'status' => 'cancelled',
            'cancelled_at' => Carbon::now(),
        ]);

        Notification::create([
            'user_id' => $booking->user_id,
            'title' => 'Class Booking Cancelled',
            'message' => "Your booking for '{$booking->schedule->gymClass->title}' on {$booking->schedule->session_date->toDateString()} has been cancelled.",
            'type' => 'cancellation',
        ]);

        AuditService::log($user->id, 'cancel_booking', 'ClassBooking', $booking->id);

        return response()->json(['message' => 'Booking cancelled successfully.']);
    }
}
