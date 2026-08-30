<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('onboarding_step')->default('complete');
            $table->timestamp('onboarding_completed_at')->nullable();
        });

        DB::table('users')->update(['onboarding_completed_at' => now()]);

        Schema::table('seasons', function (Blueprint $table): void {
            $table->text('reflection')->nullable();
            $table->timestamp('recap_seen_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('seasons', function (Blueprint $table): void {
            $table->dropColumn(['reflection', 'recap_seen_at']);
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn(['onboarding_step', 'onboarding_completed_at']);
        });
    }
};
