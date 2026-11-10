<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $notifications = Notification::where('user_id', $user->id)
            ->latest('created_at')
            ->paginate($request->get('per_page', 20));

        $unreadCount = Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    public function markAsRead(Request $request, int $id): JsonResponse
    {
        $notification = Notification::where('user_id', $request->user()->id)->findOrFail($id);
        $notification->update([
            'is_read' => true,
            'read_at' => Carbon::now(),
        ]);

        return response()->json(['message' => 'Notification marked as read.']);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        Notification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => Carbon::now(),
            ]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }
}
