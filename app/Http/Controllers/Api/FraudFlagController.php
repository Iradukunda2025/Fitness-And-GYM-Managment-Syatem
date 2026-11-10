<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FraudFlag;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FraudFlagController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = FraudFlag::with(['user', 'reviewer']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('severity')) {
            $query->where('severity', $request->severity);
        }

        if ($request->filled('type')) {
            $query->where('flag_type', $request->type);
        }

        $flags = $query->latest('id')->paginate($request->get('per_page', 15));
        return response()->json($flags);
    }

    public function show(int $id): JsonResponse
    {
        $flag = FraudFlag::with(['user.memberProfile', 'reviewer'])->findOrFail($id);
        return response()->json($flag);
    }

    public function review(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:reviewed,escalated,dismissed,account_suspended',
            'investigation_notes' => 'required|string|max:1000',
        ]);

        $flag = FraudFlag::findOrFail($id);
        $user = $request->user();

        $flag->update([
            'status' => $validated['status'],
            'investigation_notes' => $validated['investigation_notes'],
            'reviewed_by_user_id' => $user->id,
        ]);

        if ($validated['status'] === 'account_suspended' && $flag->user_id) {
            $targetUser = User::find($flag->user_id);
            if ($targetUser) {
                $targetUser->update(['status' => 'suspended']);
                AuditService::log($user->id, 'suspend_user_via_fraud', 'User', $targetUser->id, [
                    'flag_id' => $flag->id,
                    'reason' => $validated['investigation_notes'],
                ]);
            }
        }

        AuditService::log($user->id, 'review_fraud_flag', 'FraudFlag', $flag->id, [
            'status' => $validated['status'],
        ]);

        return response()->json([
            'message' => 'Fraud flag reviewed successfully.',
            'flag' => $flag->load(['user', 'reviewer']),
        ]);
    }
}
