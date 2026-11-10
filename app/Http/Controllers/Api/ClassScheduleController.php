<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassBooking;
use App\Models\ClassSchedule;
use App\Models\GymClass;
use App\Models\Notification;
use App\Services\AuditService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClassScheduleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ClassSchedule::with(['gymClass.category', 'trainer.trainerProfile', 'confirmedBookings']);

        if ($request->filled('date')) {
            $query->whereDate('session_date', $request->date);
        } elseif ($request->boolean('upcoming', false)) {
            $query->whereDate('session_date', '>=', now()->toDateString());
        }

        if ($request->filled('class_id')) {
            $query->where('class_id', $request->class_id);
        }

        if ($request->filled('trainer_id')) {
            $query->where('trainer_id', $request->trainer_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $schedules = $query->orderBy('session_date', 'asc')
            ->orderBy('start_time', 'asc')
            ->paginate($request->get('per_page', 20));

        // Add available spaces attribute
        $schedules->getCollection()->transform(function ($schedule) {
            $schedule->available_spaces = $schedule->availableSpaces();
            return $schedule;
        });

        return response()->json($schedules);
    }

    public function calendar(Request $request): JsonResponse
    {
        $start = $request->get('start', Carbon::now()->startOfWeek()->toDateString());
        $end = $request->get('end', Carbon::now()->endOfWeek()->toDateString());

        $schedules = ClassSchedule::with(['gymClass.category', 'trainer'])
            ->whereBetween('session_date', [$start, $end])
            ->where('status', '!=', 'cancelled')
            ->orderBy('session_date')
            ->orderBy('start_time')
            ->get();

        $events = $schedules->map(function ($s) {
            return [
                'id' => $s->id,
                'title' => $s->gymClass->title,
                'category' => $s->gymClass->category->name,
                'trainer_name' => $s->trainer->name,
                'start' => "{$s->session_date->toDateString()}T{$s->start_time}",
                'end' => "{$s->session_date->toDateString()}T{$s->end_time}",
                'max_capacity' => $s->max_capacity,
                'available_spaces' => $s->availableSpaces(),
                'status' => $s->status,
                'class_id' => $s->class_id,
            ];
        });

        return response()->json($events);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'class_id' => 'required|exists:classes,id',
            'trainer_id' => 'required|exists:users,id',
            'session_date' => 'required|date|after_or_equal:today',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'max_capacity' => 'nullable|integer|min:1|max:100',
        ]);

        $gymClass = GymClass::findOrFail($validated['class_id']);
        $maxCap = $validated['max_capacity'] ?? $gymClass->capacity;

        // Trainer conflict check: prevent trainer overlap
        $overlap = ClassSchedule::where('trainer_id', $validated['trainer_id'])
            ->whereDate('session_date', $validated['session_date'])
            ->where('status', '!=', 'cancelled')
            ->where(function ($q) use ($validated) {
                $q->whereBetween('start_time', [$validated['start_time'], $validated['end_time']])
                  ->orWhereBetween('end_time', [$validated['start_time'], $validated['end_time']])
                  ->orWhere(function ($sub) use ($validated) {
                      $sub->where('start_time', '<=', $validated['start_time'])
                          ->where('end_time', '>=', $validated['end_time']);
                  });
            })
            ->exists();

        if ($overlap) {
            return response()->json([
                'message' => 'Trainer scheduling conflict! This trainer is already assigned to another session during this time window.'
            ], 422);
        }

        $schedule = ClassSchedule::create([
            'class_id' => $gymClass->id,
            'trainer_id' => $validated['trainer_id'],
            'session_date' => $validated['session_date'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'max_capacity' => $maxCap,
            'status' => 'scheduled',
        ]);

        AuditService::log($request->user()->id, 'create_schedule', 'ClassSchedule', $schedule->id, [
            'class' => $gymClass->title,
            'date' => $schedule->session_date->toDateString(),
        ]);

        return response()->json([
            'message' => 'Class session scheduled successfully.',
            'schedule' => $schedule->load(['gymClass.category', 'trainer']),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $schedule = ClassSchedule::with([
            'gymClass.category',
            'trainer.trainerProfile',
            'bookings.user.memberProfile',
            'attendances.user',
        ])->findOrFail($id);

        $schedule->available_spaces = $schedule->availableSpaces();
        return response()->json($schedule);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $schedule = ClassSchedule::findOrFail($id);

        $validated = $request->validate([
            'trainer_id' => 'sometimes|required|exists:users,id',
            'session_date' => 'sometimes|required|date',
            'start_time' => 'sometimes|required|date_format:H:i',
            'end_time' => 'sometimes|required|date_format:H:i|after:start_time',
            'max_capacity' => 'sometimes|required|integer|min:1|max:100',
            'status' => 'sometimes|in:scheduled,ongoing,completed,cancelled',
        ]);

        $trainerId = $validated['trainer_id'] ?? $schedule->trainer_id;
        $sessionDate = $validated['session_date'] ?? $schedule->session_date->toDateString();
        $startTime = $validated['start_time'] ?? $schedule->start_time;
        $endTime = $validated['end_time'] ?? $schedule->end_time;

        // Check conflict if trainer, date, or time changed
        if (
            $trainerId != $schedule->trainer_id ||
            $sessionDate != $schedule->session_date->toDateString() ||
            $startTime != $schedule->start_time ||
            $endTime != $schedule->end_time
        ) {
            $overlap = ClassSchedule::where('id', '!=', $id)
                ->where('trainer_id', $trainerId)
                ->whereDate('session_date', $sessionDate)
                ->where('status', '!=', 'cancelled')
                ->where(function ($q) use ($startTime, $endTime) {
                    $q->whereBetween('start_time', [$startTime, $endTime])
                      ->orWhereBetween('end_time', [$startTime, $endTime])
                      ->orWhere(function ($sub) use ($startTime, $endTime) {
                          $sub->where('start_time', '<=', $startTime)
                              ->where('end_time', '>=', $endTime);
                      });
                })
                ->exists();

            if ($overlap) {
                return response()->json([
                    'message' => 'Trainer scheduling conflict! This trainer has another session during this time.'
                ], 422);
            }

            // Notify booked members about schedule change
            $bookings = ClassBooking::where('schedule_id', $id)->where('status', 'confirmed')->get();
            foreach ($bookings as $b) {
                Notification::create([
                    'user_id' => $b->user_id,
                    'title' => 'Class Schedule Updated',
                    'message' => "Your class '{$schedule->gymClass->title}' has been updated to {$sessionDate} at {$startTime}.",
                    'type' => 'schedule_change',
                ]);
            }
        }

        $schedule->update($validated);

        AuditService::log($request->user()->id, 'update_schedule', 'ClassSchedule', $schedule->id);

        return response()->json([
            'message' => 'Schedule updated successfully.',
            'schedule' => $schedule->load(['gymClass.category', 'trainer']),
        ]);
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $schedule = ClassSchedule::with('gymClass')->findOrFail($id);
        $schedule->update(['status' => 'cancelled']);

        // Update bookings and notify participants
        $bookings = ClassBooking::where('schedule_id', $id)->where('status', 'confirmed')->get();
        foreach ($bookings as $b) {
            $b->update(['status' => 'cancelled', 'cancelled_at' => now()]);
            Notification::create([
                'user_id' => $b->user_id,
                'title' => 'Class Cancelled',
                'message' => "The session '{$schedule->gymClass->title}' on {$schedule->session_date->toDateString()} has been cancelled.",
                'type' => 'cancellation',
            ]);
        }

        AuditService::log($request->user()->id, 'cancel_schedule', 'ClassSchedule', $schedule->id);

        return response()->json(['message' => 'Class schedule cancelled and booked members notified.']);
    }
}
