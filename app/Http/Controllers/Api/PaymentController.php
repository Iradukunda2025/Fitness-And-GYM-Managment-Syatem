<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Notification;
use App\Models\Payment;
use App\Models\Receipt;
use App\Services\AuditService;
use App\Services\FraudDetectionService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Payment::with(['user', 'invoice', 'receipt']);

        if ($user->isMember()) {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('method')) {
            $query->where('payment_method', $request->method);
        }

        if ($request->filled('type')) {
            $query->where('payable_type', $request->type);
        }

        $payments = $query->latest('id')->paginate($request->get('per_page', 15));
        return response()->json($payments);
    }

    public function simulatePayment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'payable_type' => 'required|in:membership,one_time_service,class_pass',
            'amount' => 'required|numeric|min:1',
            'payment_method' => 'required|in:card,momo_mtn,airtel_money,bank_transfer,cash',
            'description' => 'required|string|max:255',
            'simulate_status' => 'nullable|in:completed,failed',
        ]);

        $user = $request->user();
        $status = $validated['simulate_status'] ?? 'completed';

        $ref = 'PAY-' . strtoupper(str_replace('_', '', $validated['payment_method'])) . '-' . strtoupper(Str::random(8));

        // Fraud check on duplicate reference
        FraudDetectionService::checkSuspiciousPayment($ref, $validated['amount'], $user->id);

        $result = DB::transaction(function () use ($user, $validated, $status, $ref) {
            $payment = Payment::create([
                'user_id' => $user->id,
                'payable_type' => $validated['payable_type'],
                'amount' => $validated['amount'],
                'payment_method' => $validated['payment_method'],
                'payment_reference' => $ref,
                'status' => $status,
                'paid_at' => $status === 'completed' ? Carbon::now() : null,
                'notes' => $validated['description'],
            ]);

            if ($status === 'completed') {
                $invNum = 'INV-' . date('Y') . '-' . str_pad(Invoice::count() + 1, 4, '0', STR_PAD_LEFT);
                $invoice = Invoice::create([
                    'invoice_number' => $invNum,
                    'user_id' => $user->id,
                    'payment_id' => $payment->id,
                    'description' => $validated['description'],
                    'amount' => $validated['amount'],
                    'tax' => 0.00,
                    'total_amount' => $validated['amount'],
                    'issue_date' => Carbon::today()->toDateString(),
                    'due_date' => Carbon::today()->toDateString(),
                    'status' => 'paid',
                ]);

                $recNum = 'REC-' . date('Y') . '-' . str_pad(Receipt::count() + 1, 4, '0', STR_PAD_LEFT);
                $receipt = Receipt::create([
                    'receipt_number' => $recNum,
                    'invoice_id' => $invoice->id,
                    'payment_id' => $payment->id,
                    'user_id' => $user->id,
                    'amount_paid' => $validated['amount'],
                    'payment_date' => Carbon::now(),
                    'payment_method' => strtoupper(str_replace('_', ' ', $validated['payment_method'])),
                    'notes' => 'Simulated transaction completed successfully.',
                ]);

                Notification::create([
                    'user_id' => $user->id,
                    'title' => 'Payment Successful',
                    'message' => "Payment of \${$validated['amount']} received for {$validated['description']}. Receipt: {$recNum}",
                    'type' => 'payment',
                ]);

                AuditService::log($user->id, 'payment_confirm', 'Payment', $payment->id, [
                    'amount' => $validated['amount'],
                    'reference' => $ref,
                ]);

                return ['payment' => $payment, 'invoice' => $invoice, 'receipt' => $receipt];
            } else {
                Notification::create([
                    'user_id' => $user->id,
                    'title' => 'Payment Failed',
                    'message' => "Simulated payment of \${$validated['amount']} failed. Please try again with an alternative method.",
                    'type' => 'payment',
                ]);

                AuditService::log($user->id, 'payment_failed', 'Payment', $payment->id, [
                    'amount' => $validated['amount'],
                ]);

                return ['payment' => $payment];
            }
        });

        return response()->json([
            'message' => $status === 'completed' ? 'Payment processed successfully.' : 'Payment simulated as failed.',
            'data' => $result,
        ], $status === 'completed' ? 201 : 400);
    }

    public function revenueSummary(): JsonResponse
    {
        $totalRevenue = Payment::where('status', 'completed')->sum('amount');
        $thisMonthRevenue = Payment::where('status', 'completed')
            ->whereMonth('paid_at', Carbon::now()->month)
            ->whereYear('paid_at', Carbon::now()->year)
            ->sum('amount');

        $byMethod = Payment::where('status', 'completed')
            ->select('payment_method', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('payment_method')
            ->get();

        $byType = Payment::where('status', 'completed')
            ->select('payable_type', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('payable_type')
            ->get();

        return response()->json([
            'total_revenue' => (float)$totalRevenue,
            'this_month_revenue' => (float)$thisMonthRevenue,
            'by_payment_method' => $byMethod,
            'by_payable_type' => $byType,
        ]);
    }
}
