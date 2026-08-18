<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('objectives', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('season_id');
            $table->string('title');
            $table->unsignedSmallInteger('creation_order');
            $table->timestamp('completed_at')->nullable();
            $table->unsignedSmallInteger('earned_sp')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign(['user_id', 'season_id'])
                ->references(['user_id', 'id'])
                ->on('seasons')
                ->restrictOnDelete();
            $table->unique(['season_id', 'creation_order']);
            $table->index(['user_id', 'season_id', 'completed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('objectives');
    }
};
