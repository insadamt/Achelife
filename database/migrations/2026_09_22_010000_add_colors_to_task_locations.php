<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('task_folders', function (Blueprint $table): void {
            $table->string('color', 7)->nullable()->after('name');
        });

        Schema::table('task_projects', function (Blueprint $table): void {
            $table->string('color', 7)->nullable()->after('name');
        });
    }

    public function down(): void
    {
        Schema::table('task_projects', function (Blueprint $table): void {
            $table->dropColumn('color');
        });

        Schema::table('task_folders', function (Blueprint $table): void {
            $table->dropColumn('color');
        });
    }
};
