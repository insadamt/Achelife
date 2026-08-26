<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('season_rollover_preference')->default('automatic');
            $table->boolean('hold_next_season')->default(false);
        });

        Schema::table('seasons', function (Blueprint $table): void {
            $table->timestamp('finalized_at')->nullable();
        });

        Schema::create('season_intermissions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('after_season_id')->constrained('seasons')->cascadeOnDelete();
            $table->string('reason');
            $table->date('started_on');
            $table->date('ended_before')->nullable();
            $table->timestamps();

            $table->unique('after_season_id');
            $table->index(['user_id', 'ended_before']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('season_intermissions');

        Schema::table('seasons', function (Blueprint $table): void {
            $table->dropColumn('finalized_at');
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn(['season_rollover_preference', 'hold_next_season']);
        });
    }
};
