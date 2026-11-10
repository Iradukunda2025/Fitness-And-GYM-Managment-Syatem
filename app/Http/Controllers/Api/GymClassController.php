<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GymClass;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GymClassController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = GymClass::with(['category', 'trainer.trainerProfile']);

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('trainer_id')) {
            $query->where('trainer_id', $request->trainer_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $classes = $query->latest('id')->paginate($request->get('per_page', 15));
        return response()->json($classes);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:class_categories,id',
            'trainer_id' => 'required|exists:users,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'capacity' => 'required|integer|min:1|max:100',
            'duration_minutes' => 'required|integer|min:15|max:180',
            'room_location' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
        ]);

        $gymClass = GymClass::create($validated);

        AuditService::log($request->user()->id, 'create_class', 'GymClass', $gymClass->id, ['title' => $gymClass->title]);

        return response()->json([
            'message' => 'Class created successfully.',
            'class' => $gymClass->load(['category', 'trainer']),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $gymClass = GymClass::with(['category', 'trainer.trainerProfile', 'schedules' => function ($q) {
            $q->where('session_date', '>=', now()->toDateString())->orderBy('session_date')->orderBy('start_time');
        }])->findOrFail($id);

        return response()->json($gymClass);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $gymClass = GymClass::findOrFail($id);

        $validated = $request->validate([
            'category_id' => 'sometimes|required|exists:class_categories,id',
            'trainer_id' => 'sometimes|required|exists:users,id',
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'capacity' => 'sometimes|required|integer|min:1|max:100',
            'duration_minutes' => 'sometimes|required|integer|min:15|max:180',
            'room_location' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
        ]);

        $gymClass->update($validated);

        AuditService::log($request->user()->id, 'update_class', 'GymClass', $gymClass->id, ['title' => $gymClass->title]);

        return response()->json([
            'message' => 'Class updated successfully.',
            'class' => $gymClass->load(['category', 'trainer']),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $gymClass = GymClass::findOrFail($id);
        $gymClass->update(['is_active' => false]);

        AuditService::log($request->user()->id, 'deactivate_class', 'GymClass', $gymClass->id);

        return response()->json(['message' => 'Class deactivated successfully.']);
    }
}
