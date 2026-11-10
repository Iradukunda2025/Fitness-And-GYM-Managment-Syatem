<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MemberProfile;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::with(['memberProfile.assignedTrainer', 'trainerProfile', 'activeMembership.plan']);

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $users = $query->latest('id')->paginate($request->get('per_page', 15));

        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|string|max:20',
            'password' => 'required|string|min:6',
            'role' => 'required|in:admin,trainer,member',
            'status' => 'nullable|in:active,suspended,deactivated',
            // Member profile fields
            'gender' => 'nullable|in:male,female,other',
            'date_of_birth' => 'nullable|date',
            'address' => 'nullable|string|max:255',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'emergency_contact_relation' => 'nullable|string|max:100',
            'fitness_goals' => 'nullable|string|max:1000',
            'health_notes' => 'nullable|string|max:1000',
            'assigned_trainer_id' => 'nullable|exists:users,id',
            // Trainer profile fields
            'bio' => 'nullable|string|max:1000',
            'specialties' => 'nullable|string|max:255',
            'years_of_experience' => 'nullable|integer|min:0',
            'qualifications' => 'nullable|string|max:1000',
            'availability_status' => 'nullable|in:available,busy,on_leave',
        ]);

        $user = DB::transaction(function () use ($validated, $request) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'password' => Hash::make($validated['password']),
                'role' => $validated['role'],
                'status' => $validated['status'] ?? 'active',
            ]);

            if ($user->role === 'member') {
                MemberProfile::create([
                    'user_id' => $user->id,
                    'gender' => $validated['gender'] ?? null,
                    'date_of_birth' => $validated['date_of_birth'] ?? null,
                    'address' => $validated['address'] ?? null,
                    'emergency_contact_name' => $validated['emergency_contact_name'] ?? null,
                    'emergency_contact_phone' => $validated['emergency_contact_phone'] ?? null,
                    'emergency_contact_relation' => $validated['emergency_contact_relation'] ?? null,
                    'fitness_goals' => $validated['fitness_goals'] ?? null,
                    'health_notes' => $validated['health_notes'] ?? null,
                    'assigned_trainer_id' => $validated['assigned_trainer_id'] ?? null,
                ]);
            } elseif ($user->role === 'trainer') {
                TrainerProfile::create([
                    'user_id' => $user->id,
                    'bio' => $validated['bio'] ?? null,
                    'specialties' => $validated['specialties'] ?? null,
                    'years_of_experience' => $validated['years_of_experience'] ?? 0,
                    'qualifications' => $validated['qualifications'] ?? null,
                    'availability_status' => $validated['availability_status'] ?? 'available',
                ]);
            }

            AuditService::log($request->user()?->id, 'create_user', 'User', $user->id, [
                'role' => $user->role,
                'email' => $user->email,
            ]);

            return $user;
        });

        return response()->json([
            'message' => ucfirst($user->role) . ' account created successfully.',
            'user' => $user->load(['memberProfile', 'trainerProfile']),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $user = User::with([
            'memberProfile.assignedTrainer',
            'trainerProfile',
            'trainerCertifications',
            'memberships.plan',
            'classBookings.schedule.gymClass',
            'attendances.schedule.gymClass',
            'fitnessMetrics',
            'workoutPlans.trainer',
        ])->findOrFail($id);

        return response()->json($user);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => "sometimes|required|email|unique:users,email,{$id}",
            'phone' => 'sometimes|nullable|string|max:20',
            'status' => 'sometimes|in:active,suspended,deactivated',
            'gender' => 'nullable|in:male,female,other',
            'date_of_birth' => 'nullable|date',
            'address' => 'nullable|string|max:255',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'emergency_contact_relation' => 'nullable|string|max:100',
            'fitness_goals' => 'nullable|string|max:1000',
            'health_notes' => 'nullable|string|max:1000',
            'assigned_trainer_id' => 'nullable|exists:users,id',
            'bio' => 'nullable|string|max:1000',
            'specialties' => 'nullable|string|max:255',
            'years_of_experience' => 'nullable|integer|min:0',
            'qualifications' => 'nullable|string|max:1000',
            'availability_status' => 'nullable|in:available,busy,on_leave',
        ]);

        $user->update([
            'name' => $validated['name'] ?? $user->name,
            'email' => $validated['email'] ?? $user->email,
            'phone' => $validated['phone'] ?? $user->phone,
            'status' => $validated['status'] ?? $user->status,
        ]);

        if ($user->isMember()) {
            $user->memberProfile()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'gender' => $validated['gender'] ?? null,
                    'date_of_birth' => $validated['date_of_birth'] ?? null,
                    'address' => $validated['address'] ?? null,
                    'emergency_contact_name' => $validated['emergency_contact_name'] ?? null,
                    'emergency_contact_phone' => $validated['emergency_contact_phone'] ?? null,
                    'emergency_contact_relation' => $validated['emergency_contact_relation'] ?? null,
                    'fitness_goals' => $validated['fitness_goals'] ?? null,
                    'health_notes' => $validated['health_notes'] ?? null,
                    'assigned_trainer_id' => $validated['assigned_trainer_id'] ?? null,
                ]
            );
        } elseif ($user->isTrainer()) {
            $user->trainerProfile()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'bio' => $validated['bio'] ?? null,
                    'specialties' => $validated['specialties'] ?? null,
                    'years_of_experience' => $validated['years_of_experience'] ?? 0,
                    'qualifications' => $validated['qualifications'] ?? null,
                    'availability_status' => $validated['availability_status'] ?? 'available',
                ]
            );
        }

        AuditService::log($request->user()?->id, 'update_user', 'User', $user->id);

        return response()->json([
            'message' => 'User updated successfully.',
            'user' => $user->fresh(['memberProfile', 'trainerProfile']),
        ]);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $request->validate(['status' => 'required|in:active,suspended,deactivated']);

        $user = User::findOrFail($id);
        $oldStatus = $user->status;
        $user->update(['status' => $request->status]);

        AuditService::log($request->user()?->id, 'update_user_status', 'User', $user->id, [
            'old' => $oldStatus,
            'new' => $request->status,
        ]);

        return response()->json([
            'message' => "User status updated to {$request->status}.",
            'user' => $user,
        ]);
    }

    public function assignTrainer(Request $request, int $memberId): JsonResponse
    {
        $request->validate(['trainer_id' => 'nullable|exists:users,id']);

        $member = User::where('role', 'member')->findOrFail($memberId);
        $member->memberProfile()->updateOrCreate(
            ['user_id' => $member->id],
            ['assigned_trainer_id' => $request->trainer_id]
        );

        AuditService::log($request->user()?->id, 'assign_trainer', 'User', $member->id, [
            'trainer_id' => $request->trainer_id,
        ]);

        return response()->json([
            'message' => 'Trainer assigned successfully.',
            'member' => $member->fresh('memberProfile.assignedTrainer'),
        ]);
    }

    public function trainers(): JsonResponse
    {
        $trainers = User::where('role', 'trainer')
            ->where('status', 'active')
            ->with(['trainerProfile', 'trainerCertifications'])
            ->get();

        return response()->json($trainers);
    }

    public function assignedMembers(Request $request): JsonResponse
    {
        $trainer = $request->user();
        if (!$trainer->isTrainer() && !$trainer->isAdmin()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $members = User::where('role', 'member')
            ->whereHas('memberProfile', function ($q) use ($trainer) {
                if ($trainer->isTrainer()) {
                    $q->where('assigned_trainer_id', $trainer->id);
                }
            })
            ->with(['memberProfile', 'activeMembership.plan', 'fitnessMetrics' => fn($q) => $q->latest()->limit(1)])
            ->get();

        return response()->json($members);
    }
}
