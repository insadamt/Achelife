<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_series', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->boolean('important')->default(false);
            $table->string('recurrence_type');
            $table->json('weekdays')->nullable();
            $table->json('subtask_template')->nullable();
            $table->date('starts_on');
            $table->date('ends_before')->nullable();
            $table->date('materialized_through')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'ends_before']);
        });

        Schema::create('tasks', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('task_series_id')->nullable()->constrained('task_series')->cascadeOnDelete();
            $table->string('title');
            $table->date('scheduled_date');
            $table->date('occurrence_date')->nullable();
            $table->boolean('important')->default(false);
            $table->string('recurrence_type_snapshot')->nullable();
            $table->json('recurrence_weekdays_snapshot')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->string('completion_timing')->nullable();
            $table->boolean('importance_at_completion')->nullable();
            $table->unsignedSmallInteger('earned_sp')->nullable();
            $table->foreignId('reward_season_id')->nullable()->constrained('seasons')->nullOnDelete();
            $table->timestamps();

            $table->unique(['task_series_id', 'occurrence_date']);
            $table->index(['user_id', 'scheduled_date', 'completed_at']);
            $table->index(['user_id', 'completed_at']);
        });

        Schema::create('subtasks', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->unsignedSmallInteger('position');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['task_id', 'position']);
        });

        Schema::create('task_reschedules', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->date('from_date');
            $table->date('to_date');
            $table->timestamp('rescheduled_at');

            $table->index(['task_id', 'rescheduled_at']);
        });

        Schema::create('task_series_exclusions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('task_series_id')->constrained('task_series')->cascadeOnDelete();
            $table->date('occurrence_date');
            $table->timestamps();

            $table->unique(['task_series_id', 'occurrence_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_series_exclusions');
        Schema::dropIfExists('task_reschedules');
        Schema::dropIfExists('subtasks');
        Schema::dropIfExists('tasks');
        Schema::dropIfExists('task_series');
    }
};
