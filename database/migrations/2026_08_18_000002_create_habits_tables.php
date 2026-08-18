<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('habits', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('type');
            $table->string('unit')->nullable();
            $table->date('starts_on');
            $table->date('synchronized_through')->nullable();
            $table->unsignedInteger('current_streak')->default(0);
            $table->date('inactive_on')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['user_id', 'archived_at', 'deleted_at']);
        });

        Schema::create('habit_definition_versions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('habit_id')->constrained()->cascadeOnDelete();
            $table->date('effective_from');
            $table->string('difficulty');
            $table->string('schedule_type');
            $table->json('weekdays')->nullable();
            $table->boolean('flexible')->default(false);
            $table->decimal('numeric_target', 12, 3)->nullable();
            $table->timestamps();

            $table->unique(['habit_id', 'effective_from']);
        });

        Schema::create('habit_occurrences', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('habit_id')->constrained()->restrictOnDelete();
            $table->foreignId('season_id')->constrained('seasons')->restrictOnDelete();
            $table->date('occurrence_date');
            $table->string('occurrence_kind');
            $table->string('state')->nullable();
            $table->decimal('numeric_value', 12, 3)->nullable();
            $table->decimal('target_snapshot', 12, 3)->nullable();
            $table->string('difficulty_snapshot');
            $table->string('schedule_type_snapshot');
            $table->json('schedule_weekdays_snapshot')->nullable();
            $table->boolean('flexible_snapshot')->default(false);
            $table->unsignedSmallInteger('base_reward');
            $table->unsignedInteger('streak_after')->default(0);
            $table->decimal('reward_multiplier', 3, 1)->default(0);
            $table->unsignedSmallInteger('earned_sp')->default(0);
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->unique(['habit_id', 'occurrence_date']);
            $table->index(['user_id', 'season_id', 'occurrence_date']);
            $table->index(['habit_id', 'occurrence_date']);
        });

        Schema::create('habit_settings', function (Blueprint $table): void {
            $table->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();
            $table->string('calendar_labels')->default('calendar_dates');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('habit_settings');
        Schema::dropIfExists('habit_occurrences');
        Schema::dropIfExists('habit_definition_versions');
        Schema::dropIfExists('habits');
    }
};
