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
            $table->string('timezone', 64)->default('UTC');
            $table->date('calendar_started_on')->nullable();
        });

        Schema::table('laws', function (Blueprint $table): void {
            $table->date('created_on')->nullable();
        });

        DB::table('users')->orderBy('id')->each(function (object $user): void {
            $seasonStart = DB::table('seasons')
                ->where('user_id', $user->id)
                ->where('season_number', 1)
                ->value('start_date');

            DB::table('users')->where('id', $user->id)->update([
                'calendar_started_on' => $seasonStart ?? substr((string) $user->created_at, 0, 10),
            ]);
        });

        DB::table('laws')->orderBy('id')->each(function (object $law): void {
            DB::table('laws')->where('id', $law->id)->update([
                'created_on' => substr((string) $law->created_at, 0, 10),
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('laws', function (Blueprint $table): void {
            $table->dropColumn('created_on');
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn(['timezone', 'calendar_started_on']);
        });
    }
};
