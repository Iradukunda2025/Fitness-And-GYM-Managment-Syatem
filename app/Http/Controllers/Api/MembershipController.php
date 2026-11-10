<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Membership;
use App\Models\MembershipPlan;
use App\Models\MembershipRenewal;
use App\Models\Notification;
use App\Models\Payment;
use App\Models\Receipt;
use App\Models\User;
use App\Services\AuditService;
use App\Services\FraudDetectionService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MembershipController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Membership::with(['user', 'plan', 'renewals.payment']);

        if ($user->isMember()) {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('plan_id')) {
            $query->where('membership_plan_id', $request->plan_id);
        }

        $memberships = $query->latest('id')->paginate($request->get('per_page', 15));
        return response()->json($memberships);
    }

    public function subscribe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'membership_plan_id' => 'required|exists:membership_plans,id',
            'payment_method' => 'required|in:card,momo_mtn,airtel_money,bank_transfer,cash',
            'start_date' => 'nullable|date|after_or_equal:today',
            'auto_renew' => 'nullable|boolean',
            'user_id' => 'nullable|exists:users,id', // For admin subscribing a member
        ]);

        $currentUser = $request->user();
        $targetUserId = ($currentUser->isAdmin() && !empty($validated['user_id']))
            ? $validated['user_id']
            : $currentUser->id;

        $targetUser = User::findOrFail($targetUserId);
        $plan = MembershipPlan::findOrFail($validated['membership_plan_id']);

        // Check if user already has an active membership
        $existingActive = Membership::where('user_id', $targetUserId)
            ->where('status', 'active')
            ->where('expiry_date', '>=', now()->toDateString())
            ->first();

        if ($existingActive && !$currentUser->isAdmin()) {
            FraudDetectionService::checkMultipleActiveSubscriptions($targetUserId);
            return response()->json([
                'message' => 'You already have an active membership valid until ' . $existingActive->expiry_date->toDateString() . '. You can renew it instead.'
            ], 422);
        }

        $startDate = !empty($validated['start_date'])
            ? Carbon::parse($validated['start_date'])
            : Carbon::today();
        $expiryDate = $startDate->copy()->addMonths($plan->duration_months);

        $result = DB::transaction(function () use ($targetUser, $plan, $startDate, $expiryDate, $validated, $currentUser) {
            // 1. Create Membership
            $membership = Membership::create([
                'user_id' => $targetUser->id,
                'membership_plan_id' => $plan->id,
                'start_date' => $startDate->toDateString(),
                'expiry_date' => $expiryDate->toDateString(),
                'status' => 'active', // Activated upon payment confirmation
                'auto_renew' => $validated['auto_renew'] ?? false,
            ]);

            // 2. Create Payment Record (Simulated Payment)
            $payRef = 'PAY-' . strtoupper(str_replace('_', '', $validated['payment_method'])) . '-' . strtoupper(Str::random(8));
            $payment = Payment::create([
                'user_id' => $targetUser->id,
                'payable_type' => 'membership',
                'payable_id' => $membership->id,
                'amount' => $plan->price,
                'payment_method' => $validated['payment_method'],
                'payment_reference' => $payRef,
                'status' => 'completed',
                'paid_at' => Carbon::now(),
                'notes' => "Payment for {$plan->name} ({$plan->duration_months} Months)",
            ]);

            // 3. Create Invoice
            $invNum = 'INV-' . date('Y') . '-' . str_pad(Invoice::count() + 1, 4, '0', STR_PAD_LEFT);
            $invoice = Invoice::create([
                'invoice_number' => $invNum,
                'user_id' => $targetUser->id,
                'payment_id' => $payment->id,
                'description' => "Subscription: {$plan->name} ({$plan->duration_months} Month(s))",
                'amount' => $plan->price,
                'tax' => 0.00,
                'total_amount' => $plan->price,
                'issue_date' => Carbon::today()->toDateString(),
                'due_date' => Carbon::today()->toDateString(),
                'status' => 'paid',
            ]);

            // 4. Create Receipt
            $recNum = 'REC-' . date('Y') . '-' . str_pad(Receipt::count() + 1, 4, '0', STR_PAD_LEFT);
            $receipt = Receipt::create([
                'receipt_number' => $recNum,
                'invoice_id' => $invoice->id,
                'payment_id' => $payment->id,
                'user_id' => $targetUser->id,
                'amount_paid' => $plan->price,
                'payment_date' => Carbon::now(),
                'payment_method' => strtoupper(str_replace('_', ' ', $validated['payment_method'])),
                'notes' => 'Subscription payment confirmed. Welcome!',
            ]);

            // 5. Send Notification
            Notification::create([
                'user_id' => $targetUser->id,
                'title' => 'Membership Activated!',
                'message' => "Your {$plan->name} subscription is active until {$expiryDate->toFormattedDateString()}. Reference: {$recNum}",
                'type' => 'payment',
                'link_url' => "/memberships/{$membership->id}",
            ]);

            AuditService::log($currentUser->id, 'membership_subscribe', 'Membership', $membership->id, [
                'plan' => $plan->name,
                'amount' => $plan->price,
                'payment_ref' => $payRef,
            ]);

            return [
                'membership' => $membership->load('plan'),
                'payment' => $payment,
                'invoice' => $invoice,
                'receipt' => $receipt,
            ];
        });

        return response()->json([
            'message' => 'Subscription activated successfully.',
            'data' => $result,
        ], 201);
    }

    public function renew(Request $request, int $id): JsonResponse
    {
        $membership = Membership::with('plan')->findOrFail($id);
        $currentUser = $request->user();

        if ($currentUser->isMember() && $membership->user_id !== $currentUser->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'payment_method' => 'required|in:card,momo_mtn,airtel_money,bank_transfer,cash',
            'months' => 'nullable|integer|min:1',
        ]);

        $plan = $membership->plan;
        $monthsToAdd = $validated['months'] ?? $plan->duration_months;
        $amount = ($plan->price / max(1, $plan->duration_months)) * $monthsToAdd;

        $previousExpiry = Carbon::parse($membership->expiry_date);
        // If already expired, start from today; otherwise extend existing expiry date
        $baseDate = $previousExpiry->isPast() ? Carbon::today() : $previousExpiry;
        $newExpiry = $baseDate->copy()->addMonths($monthsToAdd);

        $result = DB::transaction(function () use ($membership, $previousExpiry, $newExpiry, $amount, $validated, $plan, $currentUser) {
            // 1. Payment
            $payRef = 'REN-' . strtoupper(str_replace('_', '', $validated['payment_method'])) . '-' . strtoupper(Str::random(8));
            $payment = Payment::create([
                'user_id' => $membership->user_id,
                'payable_type' => 'membership',
                'payable_id' => $membership->id,
                'amount' => $amount,
                'payment_method' => $validated['payment_method'],
                'payment_reference' => $payRef,
                'status' => 'completed',
                'paid_at' => Carbon::now(),
                'notes' => "Renewal for {$plan->name} ({$membership->id})",
            ]);

            // 2. Invoice
            $invNum = 'INV-' . date('Y') . '-' . str_pad(Invoice::count() + 1, 4, '0', STR_PAD_LEFT);
            $invoice = Invoice::create([
                'invoice_number' => $invNum,
                'user_id' => $membership->user_id,
                'payment_id' => $payment->id,
                'description' => "Renewal: {$plan->name} extended until {$newExpiry->toDateString()}",
                'amount' => $amount,
                'tax' => 0.00,
                'total_amount' => $amount,
                'issue_date' => Carbon::today()->toDateString(),
                'due_date' => Carbon::today()->toDateString(),
                'status' => 'paid',
            ]);

            // 3. Receipt
            $recNum = 'REC-' . date('Y') . '-' . str_pad(Receipt::count() + 1, 4, '0', STR_PAD_LEFT);
            $receipt = Receipt::create([
                'receipt_number' => $recNum,
                'invoice_id' => $invoice->id,
                'payment_id' => $payment->id,
                'user_id' => $membership->user_id,
                'amount_paid' => $amount,
                'payment_date' => Carbon::now(),
                'payment_method' => strtoupper(str_replace('_', ' ', $validated['payment_method'])),
                'notes' => 'Membership renewal confirmed.',
            ]);

            // 4. Renewal History
            $renewal = MembershipRenewal::create([
                'membership_id' => $membership->id,
                'user_id' => $membership->user_id,
                'previous_expiry_date' => $previousExpiry->toDateString(),
                'new_expiry_date' => $newExpiry->toDateString(),
                'amount_paid' => $amount,
                'payment_id' => $payment->id,
                'renewal_date' => Carbon::now(),
                'notes' => 'Online simulated renewal',
            ]);

            // 5. Update Membership
            $membership->update([
                'expiry_date' => $newExpiry->toDateString(),
                'status' => 'active',
            ]);

            // 6. Notification
            Notification::create([
                'user_id' => $membership->user_id,
                'title' => 'Membership Renewed!',
                'message' => "Your membership has been renewed until {$newExpiry->toFormattedDateString()}. Receipt: {$recNum}",
                'type' => 'renewal',
            ]);

            AuditService::log($currentUser->id, 'membership_renew', 'Membership', $membership->id, [
                'new_expiry' => $newExpiry->toDateString(),
                'amount' => $amount,
            ]);

            return [
                'membership' => $membership->fresh('plan'),
                'renewal' => $renewal,
                'receipt' => $receipt,
            ];
        });

        return response()->json([
            'message' => 'Membership renewed successfully.',
            'data' => $result,
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $membership = Membership::with(['user', 'plan', 'renewals.payment'])->findOrFail($id);

        if ($request->user()->isMember() && $membership->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        return response()->json($membership);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $request->validate(['status' => 'required|in:active,expired,suspended,cancelled']);

        $membership = Membership::findOrFail($id);
        $oldStatus = $membership->status;
        $membership->update(['status' => $request->status]);

        AuditService::log($request->user()->id, 'membership_status_update', 'Membership', $membership->id, [
            'old' => $oldStatus,
            'new' => $request->status,
        ]);

        return response()->json([
            'message' => "Membership status updated to {$request->status}.",
            'membership' => $membership,
        ]);
    }
}
