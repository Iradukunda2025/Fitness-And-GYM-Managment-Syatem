<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MembershipPlan;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MembershipPlanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = MembershipPlan::query();

        // If not admin, only show active plans
        if (!$request->user() || !$request->user()->isAdmin()) {
            $query->where('is_active', true);
        }

        $plans = $query->orderBy('price', 'asc')->get();
        return response()->json($plans);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'duration_months' => 'required|integer|min:1',
            'price' => 'required|numeric|min:0.01',
            'included_services' => 'nullable|array',
            'access_conditions' => 'nullable|string|max:500',
            'is_active' => 'nullable|boolean',
        ]);

        $plan = MembershipPlan::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'duration_months' => $validated['duration_months'],
            'price' => $validated['price'],
            'included_services' => $validated['included_services'] ?? [],
            'access_conditions' => $validated['access_conditions'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        AuditService::log($request->user()->id, 'create_membership_plan', 'MembershipPlan', $plan->id, ['name' => $plan->name]);

        return response()->json([
            'message' => 'Membership plan created successfully.',
            'plan' => $plan,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $plan = MembershipPlan::findOrFail($id);
        return response()->json($plan);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $plan = MembershipPlan::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'duration_months' => 'sometimes|required|integer|min:1',
            'price' => 'sometimes|required|numeric|min:0.01',
            'included_services' => 'nullable|array',
            'access_conditions' => 'nullable|string|max:500',
            'is_active' => 'nullable|boolean',
        ]);

        $plan->update($validated);

        AuditService::log($request->user()->id, 'update_membership_plan', 'MembershipPlan', $plan->id, ['name' => $plan->name]);

        return response()->json([
            'message' => 'Membership plan updated successfully.',
            'plan' => $plan,
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $plan = MembershipPlan::findOrFail($id);
        $plan->update(['is_active' => false]);

        AuditService::log($request->user()->id, 'deactivate_membership_plan', 'MembershipPlan', $plan->id);

        return response()->json([
            'message' => 'Membership plan deactivated successfully.',
        ]);
    }
}
