<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('trainer_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();

            $table->unique(['member_id', 'trainer_id']);
        });

        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained('conversations')->cascadeOnDelete();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('receiver_id')->constrained('users')->cascadeOnDelete();
            $table->text('message');
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('message');
            $table->string('type')->default('general');
            $table->string('link_url')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });

        Schema::create('disputes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('category', ['payment', 'class', 'trainer', 'membership', 'other'])->default('other');
            $table->string('subject');
            $table->text('description');
            $table->enum('status', ['open', 'under_review', 'resolved', 'dismissed'])->default('open');
            $table->text('resolution_notes')->nullable();
            $table->foreignId('resolved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('fraud_flags', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('flag_type'); // duplicate_registration, multiple_active_subscriptions, duplicate_class_booking, repeated_invalid_checkin, suspicious_payment_reference
            $table->enum('severity', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->text('description');
            $table->json('metadata')->nullable();
            $table->enum('status', ['flagged', 'reviewed', 'escalated', 'dismissed', 'account_suspended'])->default('flagged');
            $table->foreignId('reviewed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('investigation_notes')->nullable();
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action'); // user_register, profile_update, membership_create, etc.
            $table->string('entity_type')->nullable();
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->json('details')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('fraud_flags');
        Schema::dropIfExists('disputes');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('conversations');
    }
};
