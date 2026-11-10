<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassCategory;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClassCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = ClassCategory::withCount('classes')->get();
        return response()->json($categories);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:class_categories,name|max:255',
            'description' => 'nullable|string|max:1000',
            'icon' => 'nullable|string|max:100',
        ]);

        $category = ClassCategory::create($validated);

        AuditService::log($request->user()->id, 'create_class_category', 'ClassCategory', $category->id);

        return response()->json([
            'message' => 'Class category created successfully.',
            'category' => $category,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $category = ClassCategory::with('classes.trainer')->findOrFail($id);
        return response()->json($category);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $category = ClassCategory::findOrFail($id);

        $validated = $request->validate([
            'name' => "sometimes|required|string|max:255|unique:class_categories,name,{$id}",
            'description' => 'nullable|string|max:1000',
            'icon' => 'nullable|string|max:100',
        ]);

        $category->update($validated);

        AuditService::log($request->user()->id, 'update_class_category', 'ClassCategory', $category->id);

        return response()->json([
            'message' => 'Class category updated successfully.',
            'category' => $category,
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $category = ClassCategory::findOrFail($id);
        if ($category->classes()->count() > 0) {
            return response()->json(['message' => 'Cannot delete category that contains classes.'], 422);
        }

        $category->delete();

        AuditService::log($request->user()->id, 'delete_class_category', 'ClassCategory', $id);

        return response()->json(['message' => 'Category deleted successfully.']);
    }
}
