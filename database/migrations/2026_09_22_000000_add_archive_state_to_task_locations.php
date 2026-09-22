<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('task_folders', function (Blueprint $table): void {
            $table->timestamp('archived_at')->nullable()->after('position');
            $table->index(['user_id', 'archived_at']);
        });

        Schema::table('task_projects', function (Blueprint $table): void {
            $table->timestamp('archived_at')->nullable()->after('position');
            $table->index(['user_id', 'archived_at']);
        });
    }

    public function down(): void
    {
        Schema::table('task_projects', function (Blueprint $table): void {
            $table->dropIndex(['user_id', 'archived_at']);
            $table->dropColumn('archived_at');
        });

        Schema::table('task_folders', function (Blueprint $table): void {
            $table->dropIndex(['user_id', 'archived_at']);
            $table->dropColumn('archived_at');
        });
    }
};
