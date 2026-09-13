<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('money_merchants', function (Blueprint $table): void {
            $table->timestamp('archived_at')->nullable()->after('normalized_name');
        });
    }

    public function down(): void
    {
        Schema::table('money_merchants', function (Blueprint $table): void {
            $table->dropColumn('archived_at');
        });
    }
};
