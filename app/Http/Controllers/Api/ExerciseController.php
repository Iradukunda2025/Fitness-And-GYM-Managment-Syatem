<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exercise;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExerciseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Exercise::query();

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('target_muscle', 'like', "%{$search}%");
            });
        }

        $exercises = $query->orderBy('name', 'asc')->get();
        return response()->json($exercises);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'target_muscle' => 'nullable|string|max:100',
            'equipment' => 'nullable|string|max:100',
            'description' => 'nullable|string|max:1000',
        ]);

        $exercise = Exercise::create($validated);

        AuditService::log($request->user()->id, 'create_exercise', 'Exercise', $exercise->id);

        return response()->json([
            'message' => 'Exercise added successfully.',
            'exercise' => $exercise,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $exercise = Exercise::findOrFail($id);
        return response()->json($exercise);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $exercise = Exercise::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'category' => 'sometimes|required|string|max:100',
            'target_muscle' => 'nullable|string|max:100',
            'equipment' => 'nullable|string|max:100',
            'description' => 'nullable|string|max:1000',
        ]);

        $exercise->update($validated);

        return response()->json([
            'message' => 'Exercise updated successfully.',
            'exercise' => $exercise,
        ]);
    }
}
