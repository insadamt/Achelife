<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('seasons', function (Blueprint $table): void {
            $table->bigInteger('season_points')->default(0)->change();
        });

        Schema::create('laws', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->enum('severity', ['minor', 'major', 'critical']);
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'archived_at', 'created_at']);
            $table->unique(['user_id', 'id']);
        });

        Schema::table('seasons', function (Blueprint $table): void {
            $table->unique(['user_id', 'id']);
        });

        Schema::create('violations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('law_id');
            $table->foreignId('season_id');
            $table->date('violation_date');
            $table->enum('severity_snapshot', ['minor', 'major', 'critical']);
            $table->enum('base_penalty_snapshot', ['-10', '-50', '-100']);
            $table->unsignedInteger('sequence_number');
            $table->integer('penalty_sp');
            $table->timestamps();

            $table->foreign(['user_id', 'law_id'])
                ->references(['user_id', 'id'])
                ->on('laws')
                ->restrictOnDelete();
            $table->foreign(['user_id', 'season_id'])
                ->references(['user_id', 'id'])
                ->on('seasons')
                ->restrictOnDelete();
            $table->index(['user_id', 'season_id', 'violation_date']);
            $table->index(['law_id', 'season_id', 'violation_date', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('violations');

        Schema::table('seasons', function (Blueprint $table): void {
            $table->dropUnique(['user_id', 'id']);
            $table->unsignedBigInteger('season_points')->default(0)->change();
        });

        Schema::dropIfExists('laws');
    }
};
