<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('payable_type'); // 'membership', 'one_time_service', 'class'
            $table->unsignedBigInteger('payable_id')->nullable();
            $table->decimal('amount', 10, 2);
            $table->enum('payment_method', ['card', 'momo_mtn', 'airtel_money', 'bank_transfer', 'cash'])->default('momo_mtn');
            $table->string('payment_reference')->unique();
            $table->enum('status', ['pending', 'completed', 'failed', 'refunded', 'cancelled'])->default('completed');
            $table->timestamp('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('payment_id')->nullable()->constrained('payments')->nullOnDelete();
            $table->string('description');
            $table->decimal('amount', 10, 2);
            $table->decimal('tax', 10, 2)->default(0);
            $table->decimal('total_amount', 10, 2);
            $table->date('issue_date');
            $table->date('due_date');
            $table->enum('status', ['unpaid', 'paid', 'cancelled', 'overdue'])->default('paid');
            $table->timestamps();
        });

        Schema::create('receipts', function (Blueprint $table) {
            $table->id();
            $table->string('receipt_number')->unique();
            $table->foreignId('invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
            $table->foreignId('payment_id')->constrained('payments')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('amount_paid', 10, 2);
            $table->timestamp('payment_date')->useCurrent();
            $table->string('payment_method');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('receipts');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('payments');
    }
};
