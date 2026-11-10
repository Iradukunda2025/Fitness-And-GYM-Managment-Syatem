<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FitnessMetric;
use App\Models\Notification;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FitnessMetricController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        $targetUserId = $currentUser->id;

        if (($currentUser->isAdmin() || $currentUser->isTrainer()) && $request->filled('user_id')) {
            $targetUserId = $request->user_id;
        }

        $metrics = FitnessMetric::where('user_id', $targetUserId)
            ->orderBy('recorded_date', 'asc')
            ->get();

        // Latest summary
        $latest = $metrics->last();
        $first = $metrics->first();

        $weightChange = ($first && $latest) ? round($latest->weight_kg - $first->weight_kg, 1) : 0;
        $bmiChange = ($first && $latest) ? round($latest->bmi - $first->bmi, 1) : 0;

        return response()->json([
            'history' => $metrics,
            'summary' => [
                'current_weight' => $latest?->weight_kg,
                'current_bmi' => $latest?->bmi,
                'current_body_fat' => $latest?->body_fat_percentage,
                'total_weight_change' => $weightChange,
                'total_bmi_change' => $bmiChange,
                'records_count' => $metrics->count(),
                'latest_date' => $latest?->recorded_date?->toDateString(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'recorded_date' => 'required|date',
            'weight_kg' => 'required|numeric|min:20|max:300',
            'height_cm' => 'required|numeric|min:50|max:260',
            'body_fat_percentage' => 'nullable|numeric|min:3|max:60',
            'chest_cm' => 'nullable|numeric|min:20|max:200',
            'waist_cm' => 'nullable|numeric|min:20|max:200',
            'arms_cm' => 'nullable|numeric|min:10|max:100',
            'workout_frequency_weekly' => 'nullable|integer|min:0|max:14',
            'notes' => 'nullable|string|max:500',
            'user_id' => 'nullable|exists:users,id',
        ]);

        $currentUser = $request->user();
        $targetUserId = ($currentUser->isAdmin() || $currentUser->isTrainer()) && !empty($validated['user_id'])
            ? $validated['user_id']
            : $currentUser->id;

        $bmi = FitnessMetric::calculateBMI($validated['weight_kg'], $validated['height_cm']);

        $metric = FitnessMetric::create([
            'user_id' => $targetUserId,
            'recorded_date' => $validated['recorded_date'],
            'weight_kg' => $validated['weight_kg'],
            'height_cm' => $validated['height_cm'],
            'bmi' => $bmi,
            'body_fat_percentage' => $validated['body_fat_percentage'] ?? null,
            'chest_cm' => $validated['chest_cm'] ?? null,
            'waist_cm' => $validated['waist_cm'] ?? null,
            'arms_cm' => $validated['arms_cm'] ?? null,
            'workout_frequency_weekly' => $validated['workout_frequency_weekly'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        AuditService::log($currentUser->id, 'record_fitness_metric', 'FitnessMetric', $metric->id, [
            'weight' => $metric->weight_kg,
            'bmi' => $metric->bmi,
        ]);

        return response()->json([
            'message' => 'Fitness progress metric logged successfully.',
            'metric' => $metric,
        ], 201);
    }
}
