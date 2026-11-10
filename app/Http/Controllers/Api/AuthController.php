<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MemberProfile;
use App\Models\Notification;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'required|string|max:20',
            'password' => 'required|string|min:6|confirmed',
            'gender' => 'nullable|in:male,female,other',
            'date_of_birth' => 'nullable|date',
            'address' => 'nullable|string|max:255',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'emergency_contact_relation' => 'nullable|string|max:100',
            'fitness_goals' => 'nullable|string|max:1000',
            'health_notes' => 'nullable|string|max:1000',
        ]);

        $user = DB::transaction(function () use ($validated) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'password' => Hash::make($validated['password']),
                'role' => 'member',
                'status' => 'active',
            ]);

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
            ]);

            // Welcome notification
            Notification::create([
                'user_id' => $user->id,
                'title' => 'Welcome to ApexFit Gym!',
                'message' => 'Your account has been registered successfully. Explore our membership packages to get started.',
                'type' => 'general',
            ]);

            AuditService::log($user->id, 'user_register', 'User', $user->id, [
                'name' => $user->name,
                'email' => $user->email,
            ]);

            return $user;
        });

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful.',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user->load('memberProfile'),
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'message' => "Your account is currently {$user->status}. Please contact the gym administration."
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        AuditService::log($user->id, 'user_login', 'User', $user->id);

        $user->load(['memberProfile.assignedTrainer', 'trainerProfile', 'activeMembership.plan']);

        return response()->json([
            'message' => 'Login successful.',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            $user->currentAccessToken()->delete();
            AuditService::log($user->id, 'user_logout', 'User', $user->id);
        }

        return response()->json(['message' => 'Successfully logged out.']);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->load([
            'memberProfile.assignedTrainer',
            'trainerProfile',
            'trainerCertifications',
            'activeMembership.plan',
        ]);

        $unreadNotifications = Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'user' => $user,
            'unread_notifications_count' => $unreadNotifications,
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }

        $user->update(['password' => Hash::make($request->password)]);

        AuditService::log($user->id, 'password_change', 'User', $user->id);

        return response()->json(['message' => 'Password updated successfully.']);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'sometimes|nullable|string|max:20',
            'gender' => 'nullable|in:male,female,other',
            'date_of_birth' => 'nullable|date',
            'address' => 'nullable|string|max:255',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'emergency_contact_relation' => 'nullable|string|max:100',
            'fitness_goals' => 'nullable|string|max:1000',
            'health_notes' => 'nullable|string|max:1000',
            // Trainer fields
            'bio' => 'nullable|string|max:1000',
            'specialties' => 'nullable|string|max:255',
            'years_of_experience' => 'nullable|integer|min:0',
            'qualifications' => 'nullable|string|max:1000',
            'availability_status' => 'nullable|in:available,busy,on_leave',
        ]);

        $user->update([
            'name' => $validated['name'] ?? $user->name,
            'phone' => $validated['phone'] ?? $user->phone,
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
                ]
            );
        }

        if ($user->isTrainer()) {
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

        AuditService::log($user->id, 'profile_update', 'User', $user->id);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $user->fresh(['memberProfile', 'trainerProfile']),
        ]);
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,jpg,png|max:2048', // 2MB as per specs
        ]);

        $user = $request->user();

        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->update(['profile_picture' => '/storage/' . $path]);

            AuditService::log($user->id, 'avatar_upload', 'User', $user->id, ['path' => $path]);

            return response()->json([
                'message' => 'Profile picture updated successfully.',
                'profile_picture' => $user->profile_picture,
            ]);
        }

        return response()->json(['message' => 'No image uploaded.'], 400);
    }
}
