<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Receipt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceReceiptController extends Controller
{
    public function invoices(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Invoice::with(['user', 'payment']);

        if ($user->isMember()) {
            $query->where('user_id', $user->id);
        }

        $invoices = $query->latest('id')->paginate($request->get('per_page', 15));
        return response()->json($invoices);
    }

    public function showInvoice(Request $request, int $id): JsonResponse
    {
        $invoice = Invoice::with(['user.memberProfile', 'payment', 'receipt'])->findOrFail($id);

        if ($request->user()->isMember() && $invoice->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        return response()->json($invoice);
    }

    public function receipts(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Receipt::with(['user', 'payment', 'invoice']);

        if ($user->isMember()) {
            $query->where('user_id', $user->id);
        }

        $receipts = $query->latest('id')->paginate($request->get('per_page', 15));
        return response()->json($receipts);
    }

    public function showReceipt(Request $request, int $id): JsonResponse
    {
        $receipt = Receipt::with(['user.memberProfile', 'payment', 'invoice'])->findOrFail($id);

        if ($request->user()->isMember() && $receipt->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        return response()->json($receipt);
    }
}
