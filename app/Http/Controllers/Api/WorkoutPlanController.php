<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\WorkoutPlan;
use App\Models\WorkoutPlanExercise;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WorkoutPlanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = WorkoutPlan::with(['member.memberProfile', 'trainer.trainerProfile', 'exercises']);

        if ($user->isMember()) {
            $query->where('member_id', $user->id);
        } elseif ($user->isTrainer()) {
            $query->where('trainer_id', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $plans = $query->latest('id')->paginate($request->get('per_page', 15));
        return response()->json($plans);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'member_id' => 'required|exists:users,id',
            'title' => 'required|string|max:255',
            'objective' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'exercises' => 'required|array|min:1',
            'exercises.*.exercise_id' => 'nullable|exists:exercises,id',
            'exercises.*.exercise_name' => 'required|string|max:255',
            'exercises.*.target_muscle' => 'nullable|string|max:100',
            'exercises.*.sets' => 'required|integer|min:1|max:20',
            'exercises.*.repetitions' => 'required|string|max:50',
            'exercises.*.rest_period_seconds' => 'required|integer|min:0|max:600',
            'exercises.*.scheduled_day' => 'required|string|max:50',
            'exercises.*.trainer_instructions' => 'nullable|string|max:500',
        ]);

        $currentUser = $request->user();
        $trainerId = $currentUser->isTrainer() ? $currentUser->id : ($request->input('trainer_id', $currentUser->id));

        $plan = DB::transaction(function () use ($validated, $trainerId, $currentUser) {
            $workoutPlan = WorkoutPlan::create([
                'member_id' => $validated['member_id'],
                'trainer_id' => $trainerId,
                'title' => $validated['title'],
                'objective' => $validated['objective'] ?? null,
                'description' => $validated['description'] ?? null,
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'] ?? null,
                'status' => 'active',
                'structured_exercises' => $validated['exercises'], // stored structured JSON
            ]);

            foreach ($validated['exercises'] as $index => $item) {
                WorkoutPlanExercise::create([
                    'workout_plan_id' => $workoutPlan->id,
                    'exercise_id' => $item['exercise_id'] ?? null,
                    'exercise_name' => $item['exercise_name'],
                    'target_muscle' => $item['target_muscle'] ?? null,
                    'sets' => $item['sets'],
                    'repetitions' => $item['repetitions'],
                    'rest_period_seconds' => $item['rest_period_seconds'],
                    'scheduled_day' => $item['scheduled_day'],
                    'exercise_order' => $index + 1,
                    'trainer_instructions' => $item['trainer_instructions'] ?? null,
                ]);
            }

            Notification::create([
                'user_id' => $validated['member_id'],
                'title' => 'New Workout Plan Assigned!',
                'message' => "Coach has designed a personalized plan: '{$workoutPlan->title}'. Check your exercises and schedule.",
                'type' => 'workout',
                'link_url' => "/workout-plans/{$workoutPlan->id}",
            ]);

            AuditService::log($currentUser->id, 'create_workout_plan', 'WorkoutPlan', $workoutPlan->id, [
                'title' => $workoutPlan->title,
                'member_id' => $workoutPlan->member_id,
            ]);

            return $workoutPlan;
        });

        return response()->json([
            'message' => 'Workout plan created and assigned successfully.',
            'plan' => $plan->load(['member', 'trainer', 'exercises']),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $plan = WorkoutPlan::with([
            'member.memberProfile',
            'trainer.trainerProfile',
            'exercises',
            'sessions' => fn($q) => $q->latest('session_date')->limit(5),
        ])->findOrFail($id);

        return response()->json($plan);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $plan = WorkoutPlan::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'objective' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'start_date' => 'sometimes|required|date',
            'end_date' => 'nullable|date',
            'status' => 'sometimes|in:active,completed,archived',
            'exercises' => 'nullable|array',
        ]);

        DB::transaction(function () use ($plan, $validated, $request) {
            $plan->update([
                'title' => $validated['title'] ?? $plan->title,
                'objective' => $validated['objective'] ?? $plan->objective,
                'description' => $validated['description'] ?? $plan->description,
                'start_date' => $validated['start_date'] ?? $plan->start_date,
                'end_date' => $validated['end_date'] ?? $plan->end_date,
                'status' => $validated['status'] ?? $plan->status,
                'structured_exercises' => $validated['exercises'] ?? $plan->structured_exercises,
            ]);

            if (isset($validated['exercises'])) {
                $plan->exercises()->delete();
                foreach ($validated['exercises'] as $index => $item) {
                    WorkoutPlanExercise::create([
                        'workout_plan_id' => $plan->id,
                        'exercise_id' => $item['exercise_id'] ?? null,
                        'exercise_name' => $item['exercise_name'],
                        'target_muscle' => $item['target_muscle'] ?? null,
                        'sets' => $item['sets'] ?? 3,
                        'repetitions' => $item['repetitions'] ?? '10-12',
                        'rest_period_seconds' => $item['rest_period_seconds'] ?? 60,
                        'scheduled_day' => $item['scheduled_day'] ?? 'Monday',
                        'exercise_order' => $index + 1,
                        'trainer_instructions' => $item['trainer_instructions'] ?? null,
                    ]);
                }
            }

            Notification::create([
                'user_id' => $plan->member_id,
                'title' => 'Workout Plan Updated',
                'message' => "Your workout plan '{$plan->title}' has been updated.",
                'type' => 'workout',
            ]);

            AuditService::log($request->user()->id, 'update_workout_plan', 'WorkoutPlan', $plan->id);
        });

        return response()->json([
            'message' => 'Workout plan updated successfully.',
            'plan' => $plan->fresh(['member', 'trainer', 'exercises']),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $plan = WorkoutPlan::findOrFail($id);
        $plan->update(['status' => 'archived']);

        AuditService::log($request->user()->id, 'archive_workout_plan', 'WorkoutPlan', $plan->id);

        return response()->json(['message' => 'Workout plan archived.']);
    }
}
