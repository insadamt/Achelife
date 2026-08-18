<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seasons', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('season_number');
            $table->date('start_date');
            $table->date('end_date');
            $table->unsignedBigInteger('season_points')->default(0);
            $table->string('rank')->nullable();
            $table->timestamp('introduced_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'season_number']);
            $table->unique(['user_id', 'start_date']);
            $table->unique(['user_id', 'end_date']);
            $table->index(['user_id', 'start_date', 'end_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seasons');
    }
};
