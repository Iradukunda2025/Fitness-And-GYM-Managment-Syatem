<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('class_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->string('icon')->nullable();
            $table->timestamps();
        });

        Schema::create('classes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('class_categories')->restrictOnDelete();
            $table->foreignId('trainer_id')->constrained('users')->restrictOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->integer('capacity')->default(20);
            $table->integer('duration_minutes')->default(60);
            $table->string('room_location')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('class_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('trainer_id')->constrained('users')->restrictOnDelete();
            $table->date('session_date')->index();
            $table->time('start_time');
            $table->time('end_time');
            $table->integer('max_capacity');
            $table->enum('status', ['scheduled', 'ongoing', 'completed', 'cancelled'])->default('scheduled')->index();
            $table->timestamps();
        });

        Schema::create('class_bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schedule_id')->constrained('class_schedules')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('booking_reference')->unique();
            $table->enum('status', ['pending', 'confirmed', 'cancelled', 'attended', 'missed', 'waitlisted'])->default('confirmed')->index();
            $table->timestamp('booked_at')->useCurrent();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            // Constraint: prevent duplicate active bookings for the same schedule by the same user
            $table->unique(['schedule_id', 'user_id', 'status'], 'booking_unique_active');
        });

        Schema::create('attendance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained('class_bookings')->cascadeOnDelete();
            $table->foreignId('schedule_id')->constrained('class_schedules')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('check_in_time')->useCurrent();
            $table->enum('status', ['present', 'absent', 'late', 'excused'])->default('present');
            $table->foreignId('verified_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('notes')->nullable();
            $table->timestamps();

            $table->unique(['booking_id'], 'attendance_booking_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance');
        Schema::dropIfExists('class_bookings');
        Schema::dropIfExists('class_schedules');
        Schema::dropIfExists('classes');
        Schema::dropIfExists('class_categories');
    }
};
