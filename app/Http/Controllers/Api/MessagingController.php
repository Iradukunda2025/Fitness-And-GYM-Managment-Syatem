<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Notification;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessagingController extends Controller
{
    public function conversations(Request $request): JsonResponse
    {
        $user = $request->user();

        $conversations = Conversation::where('member_id', $user->id)
            ->orWhere('trainer_id', $user->id)
            ->with([
                'member.memberProfile',
                'trainer.trainerProfile',
                'latestMessage',
            ])
            ->orderBy('last_message_at', 'desc')
            ->get();

        return response()->json($conversations);
    }

    public function startConversation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'trainer_id' => 'required|exists:users,id',
        ]);

        $user = $request->user();
        $memberId = $user->isMember() ? $user->id : $request->input('member_id');
        $trainerId = $user->isTrainer() ? $user->id : $validated['trainer_id'];

        $conversation = Conversation::firstOrCreate(
            ['member_id' => $memberId, 'trainer_id' => $trainerId],
            ['last_message_at' => Carbon::now()]
        );

        return response()->json($conversation->load(['member', 'trainer', 'messages']));
    }

    public function messages(Request $request, int $conversationId): JsonResponse
    {
        $user = $request->user();
        $conversation = Conversation::findOrFail($conversationId);

        // Security check
        if ($user->id !== $conversation->member_id && $user->id !== $conversation->trainer_id && !$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized conversation.'], 403);
        }

        // Mark incoming messages as read
        Message::where('conversation_id', $conversationId)
            ->where('receiver_id', $user->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => Carbon::now(),
            ]);

        $messages = Message::where('conversation_id', $conversationId)
            ->with(['sender:id,name,role,profile_picture'])
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'conversation' => $conversation->load(['member', 'trainer']),
            'messages' => $messages,
        ]);
    }

    public function sendMessage(Request $request, int $conversationId): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string|max:3000',
        ]);

        $user = $request->user();
        $conversation = Conversation::findOrFail($conversationId);

        if ($user->id !== $conversation->member_id && $user->id !== $conversation->trainer_id && !$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $receiverId = ($user->id === $conversation->member_id) ? $conversation->trainer_id : $conversation->member_id;

        $msg = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user->id,
            'receiver_id' => $receiverId,
            'message' => $validated['message'],
            'is_read' => false,
        ]);

        $conversation->update(['last_message_at' => Carbon::now()]);

        // Notify recipient
        Notification::create([
            'user_id' => $receiverId,
            'title' => "New message from {$user->name}",
            'message' => Str::limit($validated['message'], 100),
            'type' => 'message',
            'link_url' => "/messages",
        ]);

        return response()->json([
            'message' => 'Message sent.',
            'data' => $msg->load('sender:id,name,role,profile_picture'),
        ], 201);
    }
}
