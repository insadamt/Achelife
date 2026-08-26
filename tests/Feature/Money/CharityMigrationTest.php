<?php

namespace Tests\Feature\Money;

use Carbon\CarbonImmutable;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use ReflectionMethod;
use Tests\Concerns\CreatesMoney;
use Tests\TestCase;

class CharityMigrationTest extends TestCase
{
    use CreatesMoney, RefreshDatabase;

    public function test_legacy_charity_history_and_custom_subcategories_are_migrated_without_financial_changes(): void
    {
        CarbonImmutable::setTestNow('2026-08-26 10:00:00');
        $user = $this->moneyUser();
        $account = $this->moneyAccount($user, initialMinor: 10000);
        $this->restoreLegacyBuiltinKeyColumn();
        $legacyCategoryId = DB::table('money_categories')->insertGetId([
            'user_id' => $user->id,
            'type' => 'expense',
            'name' => 'Charity',
            'builtin_key' => 'charity',
            'preset_key' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $mosqueId = DB::table('money_subcategories')->insertGetId([
            'user_id' => $user->id,
            'category_id' => $legacyCategoryId,
            'name' => 'Mosque',
            'preset_key' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $uncategorizedTransactionId = $this->legacyCharityTransaction($user->id, $account->id, $legacyCategoryId, null, 2500, '2026-08-10');
        $customTransactionId = $this->legacyCharityTransaction($user->id, $account->id, $legacyCategoryId, $mosqueId, 1200, '2026-08-11');

        $migration = require database_path('migrations/2026_08_26_000000_add_money_presets_and_transfer_fees.php');
        $method = new ReflectionMethod($migration, 'migrateLegacyCharityCategories');
        $method->invoke($migration);

        $giftsAndDonationsId = DB::table('money_categories')->where('preset_key', 'money.expense.gifts-donations')->value('id');
        $charityId = DB::table('money_subcategories')->where('preset_key', 'money.expense.gifts-donations.charity')->value('id');
        $this->assertDatabaseMissing('money_categories', ['id' => $legacyCategoryId]);
        $this->assertDatabaseHas('money_subcategories', ['id' => $mosqueId, 'category_id' => $giftsAndDonationsId, 'name' => 'Mosque']);
        $this->assertDatabaseHas('money_transactions', [
            'id' => $uncategorizedTransactionId,
            'category_id' => $giftsAndDonationsId,
            'subcategory_id' => $charityId,
            'amount_minor' => 2500,
            'transaction_date' => '2026-08-10',
        ]);
        $this->assertDatabaseHas('money_transactions', [
            'id' => $customTransactionId,
            'category_id' => $giftsAndDonationsId,
            'subcategory_id' => $mosqueId,
            'amount_minor' => 1200,
            'transaction_date' => '2026-08-11',
        ]);
    }

    public function test_legacy_charity_without_history_migrates_cleanly(): void
    {
        $user = $this->moneyUser();
        $this->restoreLegacyBuiltinKeyColumn();
        DB::table('money_categories')->insert([
            'user_id' => $user->id,
            'type' => 'expense',
            'name' => 'Charity',
            'builtin_key' => 'charity',
            'preset_key' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $migration = require database_path('migrations/2026_08_26_000000_add_money_presets_and_transfer_fees.php');
        (new ReflectionMethod($migration, 'migrateLegacyCharityCategories'))->invoke($migration);

        $this->assertDatabaseHas('money_categories', ['user_id' => $user->id, 'preset_key' => 'money.expense.gifts-donations']);
        $this->assertDatabaseHas('money_subcategories', ['user_id' => $user->id, 'preset_key' => 'money.expense.gifts-donations.charity']);
    }

    private function legacyCharityTransaction(int $userId, int $accountId, int $categoryId, ?int $subcategoryId, int $amountMinor, string $date): int
    {
        return DB::table('money_transactions')->insertGetId([
            'user_id' => $userId,
            'type' => 'expense',
            'amount_minor' => $amountMinor,
            'fee_minor' => 0,
            'account_id' => $accountId,
            'destination_account_id' => null,
            'category_id' => $categoryId,
            'subcategory_id' => $subcategoryId,
            'transaction_date' => $date,
            'note' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function restoreLegacyBuiltinKeyColumn(): void
    {
        Schema::table('money_categories', function (Blueprint $table): void {
            $table->string('builtin_key')->nullable();
            $table->unique(['user_id', 'builtin_key']);
        });
    }
}
