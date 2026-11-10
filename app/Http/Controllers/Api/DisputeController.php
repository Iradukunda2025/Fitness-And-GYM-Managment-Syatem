<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Dispute;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DisputeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Dispute::with(['user', 'resolvedBy']);

        if ($user->isMember()) {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $disputes = $query->latest('id')->paginate($request->get('per_page', 15));
        return response()->json($disputes);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category' => 'required|in:payment,class,trainer,membership,other',
            'subject' => 'required|string|max:255',
            'description' => 'required|string|max:2000',
        ]);

        $user = $request->user();

        $dispute = Dispute::create([
            'user_id' => $user->id,
            'category' => $validated['category'],
            'subject' => $validated['subject'],
            'description' => $validated['description'],
            'status' => 'open',
        ]);

        AuditService::log($user->id, 'create_dispute', 'Dispute', $dispute->id, ['subject' => $dispute->subject]);

        return response()->json([
            'message' => 'Your complaint/inquiry has been submitted for administrative review.',
            'dispute' => $dispute,
        ], 201);
    }

    public function resolve(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:under_review,resolved,dismissed',
            'resolution_notes' => 'required|string|max:1000',
        ]);

        $dispute = Dispute::findOrFail($id);
        $user = $request->user();

        $dispute->update([
            'status' => $validated['status'],
            'resolution_notes' => $validated['resolution_notes'],
            'resolved_by_user_id' => $user->id,
        ]);

        AuditService::log($user->id, 'resolve_dispute', 'Dispute', $dispute->id, [
            'status' => $validated['status'],
        ]);

        return response()->json([
            'message' => 'Dispute updated successfully.',
            'dispute' => $dispute->load(['user', 'resolvedBy']),
        ]);
    }
}
