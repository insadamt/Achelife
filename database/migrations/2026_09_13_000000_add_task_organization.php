<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_folders', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'id']);
            $table->index(['user_id', 'position']);
        });

        Schema::create('task_projects', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('task_folder_id')->nullable();
            $table->string('name');
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'id']);
            $table->foreign(['user_id', 'task_folder_id'])
                ->references(['user_id', 'id'])
                ->on('task_folders')
                ->restrictOnDelete();
            $table->index(['user_id', 'task_folder_id', 'position']);
        });

        Schema::table('task_series', function (Blueprint $table): void {
            $table->foreignId('task_project_id')->nullable()->after('user_id');
            $table->text('notes')->nullable()->after('title');

            $table->foreign(['user_id', 'task_project_id'])
                ->references(['user_id', 'id'])
                ->on('task_projects')
                ->restrictOnDelete();
            $table->index(['user_id', 'task_project_id']);
        });

        Schema::table('tasks', function (Blueprint $table): void {
            $table->foreignId('task_project_id')->nullable()->after('task_series_id');
            $table->text('notes')->nullable()->after('title');
            $table->unsignedInteger('position')->default(0)->after('notes');

            $table->foreign(['user_id', 'task_project_id'])
                ->references(['user_id', 'id'])
                ->on('task_projects')
                ->restrictOnDelete();
            $table->index(['user_id', 'task_project_id', 'position']);
        });

        $positionsByUser = [];

        DB::table('tasks')->orderBy('id')->chunkById(200, function ($tasks) use (&$positionsByUser): void {
            foreach ($tasks as $task) {
                $position = $positionsByUser[$task->user_id] ?? 0;
                DB::table('tasks')->where('id', $task->id)->update(['position' => $position]);
                $positionsByUser[$task->user_id] = $position + 1;
            }
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table): void {
            $table->dropForeign(['user_id', 'task_project_id']);
            $table->dropIndex(['user_id', 'task_project_id', 'position']);
            $table->dropColumn(['task_project_id', 'notes', 'position']);
        });

        Schema::table('task_series', function (Blueprint $table): void {
            $table->dropForeign(['user_id', 'task_project_id']);
            $table->dropIndex(['user_id', 'task_project_id']);
            $table->dropColumn(['task_project_id', 'notes']);
        });

        Schema::dropIfExists('task_projects');
        Schema::dropIfExists('task_folders');
    }
};
