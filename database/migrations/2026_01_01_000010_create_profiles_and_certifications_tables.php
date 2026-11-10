<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date_of_birth')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->string('address')->nullable();
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone')->nullable();
            $table->string('emergency_contact_relation')->nullable();
            $table->text('fitness_goals')->nullable();
            $table->text('health_notes')->nullable();
            $table->foreignId('assigned_trainer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('trainer_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('bio')->nullable();
            $table->string('specialties')->nullable(); // e.g. "Strength, Yoga, HIIT"
            $table->integer('years_of_experience')->default(0);
            $table->text('qualifications')->nullable();
            $table->enum('availability_status', ['available', 'busy', 'on_leave'])->default('available');
            $table->timestamps();
        });

        Schema::create('trainer_certifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trainer_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->string('issuing_organization');
            $table->date('issue_date');
            $table->date('expiry_date')->nullable();
            $table->string('document_path')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trainer_certifications');
        Schema::dropIfExists('trainer_profiles');
        Schema::dropIfExists('member_profiles');
    }
};
