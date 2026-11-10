<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\ClassBooking;
use App\Models\ClassSchedule;
use App\Models\Notification;
use App\Services\AuditService;
use App\Services\FraudDetectionService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AttendanceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Attendance::with([
            'booking.schedule.gymClass',
            'user.memberProfile',
            'schedule.gymClass',
            'schedule.trainer',
            'verifiedBy',
        ]);

        if ($user->isMember()) {
            $query->where('user_id', $user->id);
        } elseif ($user->isTrainer()) {
            $query->whereHas('schedule', fn($q) => $q->where('trainer_id', $user->id));
        }

        if ($request->filled('schedule_id')) {
            $query->where('schedule_id', $request->schedule_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date')) {
            $query->whereDate('check_in_time', $request->date);
        }

        $records = $query->latest('check_in_time')->paginate($request->get('per_page', 20));
        return response()->json($records);
    }

    public function checkIn(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'booking_id' => 'required|exists:class_bookings,id',
        ]);

        $user = $request->user();
        $booking = ClassBooking::with('schedule.gymClass')->findOrFail($validated['booking_id']);

        // Check ownership
        if ($user->isMember() && $booking->user_id !== $user->id) {
            FraudDetectionService::flagInvalidCheckIn($user->id, $booking->schedule_id, 'Attempt to check-in for another user booking');
            return response()->json(['message' => 'Unauthorized booking.'], 403);
        }

        if ($booking->status === 'cancelled') {
            FraudDetectionService::flagInvalidCheckIn($booking->user_id, $booking->schedule_id, 'Check-in attempted for cancelled booking');
            return response()->json(['message' => 'Cannot check-in for a cancelled booking.'], 422);
        }

        $schedule = $booking->schedule;
        $today = Carbon::today();

        // Check date window (allow check-in on the scheduled day)
        if (!$schedule->session_date->isSameDay($today) && !$user->isAdmin()) {
            FraudDetectionService::flagInvalidCheckIn($booking->user_id, $schedule->id, "Check-in attempted on non-session date ({$today->toDateString()} vs {$schedule->session_date->toDateString()})");
            return response()->json([
                'message' => "Check-in is only available on the scheduled date: {$schedule->session_date->toFormattedDateString()}."
            ], 422);
        }

        // Check duplicate check-in
        $existing = Attendance::where('booking_id', $booking->id)->first();
        if ($existing) {
            return response()->json([
                'message' => 'You have already checked in for this session at ' . $existing->check_in_time->toTimeString() . '.',
                'attendance' => $existing,
            ]);
        }

        $attendance = DB::transaction(function () use ($booking, $schedule, $user) {
            $att = Attendance::create([
                'booking_id' => $booking->id,
                'schedule_id' => $schedule->id,
                'user_id' => $booking->user_id,
                'check_in_time' => Carbon::now(),
                'status' => 'present',
                'verified_by_user_id' => $user->isTrainer() || $user->isAdmin() ? $user->id : null,
                'notes' => 'Self check-in via mobile/web platform',
            ]);

            $booking->update(['status' => 'attended']);

            AuditService::log($user->id, 'class_checkin', 'Attendance', $att->id, [
                'class' => $schedule->gymClass->title,
                'booking_id' => $booking->id,
            ]);

            return $att;
        });

        return response()->json([
            'message' => 'Check-in successful! Enjoy your workout session.',
            'attendance' => $attendance->load(['schedule.gymClass', 'user']),
        ], 201);
    }

    public function markAttendance(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'booking_id' => 'required|exists:class_bookings,id',
            'status' => 'required|in:present,absent,late,excused',
            'notes' => 'nullable|string|max:500',
        ]);

        $user = $request->user();
        $booking = ClassBooking::with('schedule.gymClass')->findOrFail($validated['booking_id']);

        $attendance = Attendance::updateOrCreate(
            ['booking_id' => $booking->id],
            [
                'schedule_id' => $booking->schedule_id,
                'user_id' => $booking->user_id,
                'check_in_time' => Carbon::now(),
                'status' => $validated['status'],
                'verified_by_user_id' => $user->id,
                'notes' => $validated['notes'] ?? null,
            ]
        );

        // Update booking status accordingly
        $newBookingStatus = ($validated['status'] === 'absent') ? 'missed' : 'attended';
        $booking->update(['status' => $newBookingStatus]);

        if ($validated['status'] === 'absent') {
            Notification::create([
                'user_id' => $booking->user_id,
                'title' => 'Missed Class Session',
                'message' => "You were marked absent for '{$booking->schedule->gymClass->title}' on {$booking->schedule->session_date->toDateString()}.",
                'type' => 'cancellation',
            ]);
        }

        AuditService::log($user->id, 'mark_attendance', 'Attendance', $attendance->id, [
            'status' => $validated['status'],
            'booking_id' => $booking->id,
        ]);

        return response()->json([
            'message' => "Attendance status marked as {$validated['status']}.",
            'attendance' => $attendance->load(['booking.schedule.gymClass', 'user']),
        ]);
    }

    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Attendance::query();
        if ($user->isMember()) {
            $query->where('user_id', $user->id);
        } elseif ($user->isTrainer()) {
            $query->whereHas('schedule', fn($q) => $q->where('trainer_id', $user->id));
        }

        $totalPresent = (clone $query)->whereIn('status', ['present', 'late'])->count();
        $totalAbsent = (clone $query)->where('status', 'absent')->count();
        $totalExcused = (clone $query)->where('status', 'excused')->count();
        $total = $totalPresent + $totalAbsent + $totalExcused;

        $rate = $total > 0 ? round(($totalPresent / $total) * 100, 1) : 0;

        return response()->json([
            'total_recorded' => $total,
            'attended' => $totalPresent,
            'missed' => $totalAbsent,
            'excused' => $totalExcused,
            'attendance_rate' => $rate,
        ]);
    }
}
