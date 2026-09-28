<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appearance_settings', function (Blueprint $table): void {
            $table->string('light_accent', 7)->default('#D7E66B');
            $table->string('dark_accent', 7)->default('#D7E66B');
        });
    }

    public function down(): void
    {
        Schema::table('appearance_settings', function (Blueprint $table): void {
            $table->dropColumn(['light_accent', 'dark_accent']);
        });
    }
};
