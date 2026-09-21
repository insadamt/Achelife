<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('task_focus_sessions', function (Blueprint $table): void {
            $table->unsignedTinyInteger('running_marker')->nullable();
        });

        DB::table('task_focus_sessions')->where('state', 'running')->update(['running_marker' => 1]);

        Schema::table('task_focus_sessions', function (Blueprint $table): void {
            $table->dropUnique('task_focus_sessions_user_id_active_marker_unique');
            $table->unique(['user_id', 'task_id', 'active_marker'], 'task_focus_user_task_active_unique');
            $table->unique(['user_id', 'running_marker'], 'task_focus_user_running_unique');
        });
    }

    public function down(): void
    {
        $multipleOpenSessions = DB::table('task_focus_sessions')
            ->where('active_marker', 1)
            ->select('user_id')
            ->groupBy('user_id')
            ->havingRaw('COUNT(*) > 1')
            ->exists();

        if ($multipleOpenSessions) {
            throw new RuntimeException('Finish all but one open Focus Session per user before rolling back this migration.');
        }

        Schema::table('task_focus_sessions', function (Blueprint $table): void {
            $table->dropUnique('task_focus_user_task_active_unique');
            $table->dropUnique('task_focus_user_running_unique');
        });

        Schema::table('task_focus_sessions', function (Blueprint $table): void {
            $table->dropColumn('running_marker');
            $table->unique(['user_id', 'active_marker']);
        });
    }
};
