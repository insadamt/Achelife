<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('money_subscription_occurrences', function (Blueprint $table): void {
            $table->enum('payment_mode', ['automatic', 'manual'])->default('manual')->after('note');
            $table->timestamp('automatic_retry_blocked_at')->nullable()->after('skipped_at');
        });

        DB::table('money_subscriptions')
            ->select(['id', 'payment_mode'])
            ->eachById(function (object $subscription): void {
                DB::table('money_subscription_occurrences')
                    ->where('subscription_id', $subscription->id)
                    ->update(['payment_mode' => $subscription->payment_mode]);
            });
    }

    public function down(): void
    {
        Schema::table('money_subscription_occurrences', function (Blueprint $table): void {
            $table->dropColumn(['payment_mode', 'automatic_retry_blocked_at']);
        });
    }
};
