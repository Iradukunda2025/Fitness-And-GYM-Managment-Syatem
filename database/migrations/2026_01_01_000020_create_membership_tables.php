<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('membership_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->integer('duration_months')->default(1);
            $table->decimal('price', 10, 2);
            $table->json('included_services')->nullable();
            $table->text('access_conditions')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('memberships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('membership_plan_id')->constrained()->restrictOnDelete();
            $table->date('start_date');
            $table->date('expiry_date');
            $table->enum('status', ['pending_payment', 'active', 'expired', 'suspended', 'cancelled'])->default('pending_payment')->index();
            $table->boolean('auto_renew')->default(false);
            $table->timestamps();
        });

        Schema::create('membership_renewals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('membership_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('previous_expiry_date');
            $table->date('new_expiry_date');
            $table->decimal('amount_paid', 10, 2);
            $table->unsignedBigInteger('payment_id')->nullable();
            $table->timestamp('renewal_date')->useCurrent();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('membership_renewals');
        Schema::dropIfExists('memberships');
        Schema::dropIfExists('membership_plans');
    }
};
