<?php

namespace Tests\Feature\Money;

use App\Enums\MoneyTransactionType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\Concerns\CreatesMoney;
use Tests\TestCase;

class MoneySubscriptionMigrationTest extends TestCase
{
    use CreatesMoney, RefreshDatabase;

    public function test_fresh_schema_contains_restore_ready_subscription_tables_and_constraints(): void
    {
        $this->assertTrue(Schema::hasColumns('money_subscriptions', [
            'user_id', 'name', 'amount_minor', 'account_id', 'category_id', 'subcategory_id', 'note',
            'starts_on', 'materialize_from', 'ends_on', 'recurrence', 'payment_mode', 'status', 'anchor_day',
            'paused_at', 'ended_at',
        ]));
        $this->assertTrue(Schema::hasColumns('money_subscription_occurrences', [
            'user_id', 'subscription_id', 'due_date', 'amount_minor', 'account_id', 'category_id',
            'subcategory_id', 'note', 'payment_mode', 'status', 'transaction_id', 'paid_at', 'skipped_at', 'automatic_retry_blocked_at',
        ]));
    }

    public function test_phase_twelve_upgrade_preserves_existing_money_rows(): void
    {
        $user = $this->moneyUser();
        $account = $this->moneyAccount($user, initialMinor: 5000);
        $category = $this->moneyCategory($user);
        $transaction = $this->moneyTransaction($user, MoneyTransactionType::Expense, $account, 1250, category: $category);
        $migration = require database_path('migrations/2026_08_26_100000_create_money_subscriptions.php');
        $processingFields = require database_path('migrations/2026_08_26_110000_add_subscription_occurrence_processing_fields.php');
        $transactionKey = require database_path('migrations/2026_08_26_120000_repair_money_transaction_subscription_key.php');

        $migration->down();
        $before = DB::table('money_transactions')->where('id', $transaction->id)->first();
        $migration->up();
        $processingFields->up();
        $transactionKey->up();
        $after = DB::table('money_transactions')->where('id', $transaction->id)->first();

        $this->assertEquals($before, $after);
        $this->assertTrue(Schema::hasTable('money_subscriptions'));
        $this->assertTrue(Schema::hasTable('money_subscription_occurrences'));
        $this->assertTrue(Schema::hasColumns('money_subscription_occurrences', ['payment_mode', 'automatic_retry_blocked_at']));
    }

    public function test_early_phase_thirteen_occurrences_receive_their_definition_payment_mode(): void
    {
        $user = $this->moneyUser();
        $account = $this->moneyAccount($user);
        $category = $this->moneyCategory($user);
        $processingFields = require database_path('migrations/2026_08_26_110000_add_subscription_occurrence_processing_fields.php');
        $processingFields->down();
        $subscriptionId = $this->insertSubscription($user->id, $account->id, $category->id, 'automatic');
        $occurrenceId = DB::table('money_subscription_occurrences')->insertGetId([
            'user_id' => $user->id,
            'subscription_id' => $subscriptionId,
            'due_date' => '2026-08-26',
            'amount_minor' => 1000,
            'account_id' => $account->id,
            'category_id' => $category->id,
            'status' => 'due',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $processingFields->up();

        $this->assertDatabaseHas('money_subscription_occurrences', [
            'id' => $occurrenceId,
            'payment_mode' => 'automatic',
            'automatic_retry_blocked_at' => null,
        ]);
    }

    public function test_early_sqlite_schema_repairs_the_parent_transaction_key(): void
    {
        Schema::table('money_transactions', function ($table): void {
            $table->dropUnique(['user_id', 'id']);
        });
        $repair = require database_path('migrations/2026_08_26_120000_repair_money_transaction_subscription_key.php');

        $repair->up();

        $hasRequiredKey = collect(Schema::getIndexes('money_transactions'))->contains(
            fn (array $index): bool => ($index['unique'] ?? false)
                && ($index['columns'] ?? []) === ['user_id', 'id'],
        );
        $this->assertTrue($hasRequiredKey);

        $user = $this->moneyUser();
        $subscription = $this->moneySubscription($user, $this->moneyAccount($user), $this->moneyCategory($user));
        $this->assertTrue($subscription->occurrences()->exists());
    }

    private function insertSubscription(int $userId, int $accountId, int $categoryId, string $paymentMode): int
    {
        return DB::table('money_subscriptions')->insertGetId([
            'user_id' => $userId,
            'name' => 'Legacy Subscription',
            'amount_minor' => 1000,
            'account_id' => $accountId,
            'category_id' => $categoryId,
            'starts_on' => '2026-08-26',
            'materialize_from' => '2026-08-26',
            'recurrence' => 'monthly',
            'payment_mode' => $paymentMode,
            'status' => 'active',
            'anchor_day' => 26,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
