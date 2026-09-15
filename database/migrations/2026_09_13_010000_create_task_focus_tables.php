<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table): void {
            $table->unique(['user_id', 'id'], 'tasks_user_id_id_unique');
        });

        Schema::create('task_focus_sessions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('task_id');
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->unsignedBigInteger('accumulated_seconds')->default(0);
            $table->string('state');
            $table->string('source');
            $table->unsignedTinyInteger('active_marker')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'active_marker']);
            $table->foreign(['user_id', 'task_id'])
                ->references(['user_id', 'id'])
                ->on('tasks')
                ->cascadeOnDelete();
            $table->index(['user_id', 'started_at']);
            $table->index(['task_id', 'started_at']);
        });

        Schema::create('task_focus_intervals', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('task_focus_session_id')->constrained()->cascadeOnDelete();
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();

            $table->index(['task_focus_session_id', 'started_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_focus_intervals');
        Schema::dropIfExists('task_focus_sessions');
        Schema::table('tasks', function (Blueprint $table): void {
            $table->dropUnique('tasks_user_id_id_unique');
        });
    }
};
