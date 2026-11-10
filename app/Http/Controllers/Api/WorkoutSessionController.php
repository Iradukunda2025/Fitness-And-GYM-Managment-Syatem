<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WorkoutSession;
use App\Models\WorkoutSessionExercise;
use App\Services\AuditService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WorkoutSessionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = WorkoutSession::with(['workoutPlan', 'exercises', 'user.memberProfile']);

        if ($user->isMember()) {
            $query->where('user_id', $user->id);
        } elseif ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $sessions = $query->latest('session_date')->paginate($request->get('per_page', 15));
        return response()->json($sessions);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'workout_plan_id' => 'nullable|exists:workout_plans,id',
            'session_date' => 'required|date',
            'duration_minutes' => 'required|integer|min:1|max:360',
            'notes' => 'nullable|string|max:1000',
            'exercises' => 'required|array|min:1',
            'exercises.*.exercise_name' => 'required|string|max:255',
            'exercises.*.sets_completed' => 'required|integer|min:1',
            'exercises.*.reps_completed' => 'nullable|string|max:50',
            'exercises.*.weight_used_kg' => 'nullable|numeric|min:0',
            'exercises.*.notes' => 'nullable|string|max:255',
        ]);

        $user = $request->user();

        $session = DB::transaction(function () use ($validated, $user) {
            $workoutSession = WorkoutSession::create([
                'user_id' => $user->id,
                'workout_plan_id' => $validated['workout_plan_id'] ?? null,
                'session_date' => $validated['session_date'],
                'duration_minutes' => $validated['duration_minutes'],
                'status' => 'completed',
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['exercises'] as $ex) {
                WorkoutSessionExercise::create([
                    'workout_session_id' => $workoutSession->id,
                    'exercise_name' => $ex['exercise_name'],
                    'sets_completed' => $ex['sets_completed'],
                    'reps_completed' => $ex['reps_completed'] ?? null,
                    'weight_used_kg' => $ex['weight_used_kg'] ?? null,
                    'notes' => $ex['notes'] ?? null,
                ]);
            }

            AuditService::log($user->id, 'log_workout_session', 'WorkoutSession', $workoutSession->id, [
                'duration' => $validated['duration_minutes'],
            ]);

            return $workoutSession;
        });

        return response()->json([
            'message' => 'Workout session recorded successfully! Great job.',
            'session' => $session->load(['exercises', 'workoutPlan']),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $session = WorkoutSession::with(['workoutPlan', 'exercises', 'user'])->findOrFail($id);
        return response()->json($session);
    }
}
