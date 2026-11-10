<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exercises', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category'); // Chest, Back, Legs, Shoulders, Arms, Core, Cardio, Full Body
            $table->string('target_muscle')->nullable();
            $table->string('equipment')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('workout_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('trainer_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->string('objective')->nullable(); // Weight Loss, Muscle Building, Endurance, Rehabilitation
            $table->text('description')->nullable();
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->enum('status', ['active', 'completed', 'archived'])->default('active');
            $table->json('structured_exercises')->nullable(); // structured exercise JSON
            $table->timestamps();
        });

        Schema::create('workout_plan_exercises', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workout_plan_id')->constrained('workout_plans')->cascadeOnDelete();
            $table->foreignId('exercise_id')->nullable()->constrained('exercises')->nullOnDelete();
            $table->string('exercise_name');
            $table->string('target_muscle')->nullable();
            $table->integer('sets')->default(3);
            $table->string('repetitions')->default('10-12');
            $table->integer('rest_period_seconds')->default(60);
            $table->string('scheduled_day')->default('Monday'); // Monday, Tuesday, etc.
            $table->integer('exercise_order')->default(1);
            $table->text('trainer_instructions')->nullable();
            $table->timestamps();
        });

        Schema::create('workout_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('workout_plan_id')->nullable()->constrained('workout_plans')->nullOnDelete();
            $table->date('session_date');
            $table->timestamp('start_time')->nullable();
            $table->timestamp('end_time')->nullable();
            $table->integer('duration_minutes')->default(0);
            $table->enum('status', ['completed', 'in_progress', 'cancelled'])->default('completed');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('workout_session_exercises', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workout_session_id')->constrained('workout_sessions')->cascadeOnDelete();
            $table->string('exercise_name');
            $table->integer('sets_completed')->default(0);
            $table->string('reps_completed')->nullable();
            $table->decimal('weight_used_kg', 6, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('fitness_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->date('recorded_date');
            $table->decimal('weight_kg', 5, 2);
            $table->decimal('height_cm', 5, 2);
            $table->decimal('bmi', 4, 1);
            $table->decimal('body_fat_percentage', 4, 1)->nullable();
            $table->decimal('chest_cm', 5, 2)->nullable();
            $table->decimal('waist_cm', 5, 2)->nullable();
            $table->decimal('arms_cm', 5, 2)->nullable();
            $table->integer('workout_frequency_weekly')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fitness_metrics');
        Schema::dropIfExists('workout_session_exercises');
        Schema::dropIfExists('workout_sessions');
        Schema::dropIfExists('workout_plan_exercises');
        Schema::dropIfExists('workout_plans');
        Schema::dropIfExists('exercises');
    }
};
