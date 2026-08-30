<?php

namespace Tests\Concerns;

use App\Actions\Money\CreateMoneyAccount;
use App\Actions\Money\CreateMoneyCategory;
use App\Actions\Money\CreateMoneySubcategory;
use App\Actions\Money\SaveMoneySubscription;
use App\Actions\Money\SaveMoneyTransaction;
use App\Data\Money\MoneySubscriptionData;
use App\Data\Money\MoneyTransactionData;
use App\Enums\MoneyCategoryType;
use App\Enums\MoneySubscriptionPaymentMode;
use App\Enums\MoneySubscriptionRecurrence;
use App\Enums\MoneyTransactionType;
use App\Models\MoneyAccount;
use App\Models\MoneyCategory;
use App\Models\MoneySubcategory;
use App\Models\MoneySubscription;
use App\Models\MoneyTransaction;
use App\Models\User;
use Carbon\CarbonImmutable;

trait CreatesMoney
{
    protected function moneyUser(string $createdOn = '2026-07-01'): User
    {
        return User::factory()->create([
            'created_at' => CarbonImmutable::parse($createdOn),
            'updated_at' => CarbonImmutable::parse($createdOn),
        ]);
    }

    protected function moneyAccount(User $user, string $name = 'Cash', string $currency = 'MAD', int $initialMinor = 0): MoneyAccount
    {
        return app(CreateMoneyAccount::class)->execute($user, $name, $currency, $initialMinor);
    }

    protected function moneyCategory(User $user, MoneyCategoryType $type = MoneyCategoryType::Expense, string $name = 'Food'): MoneyCategory
    {
        return app(CreateMoneyCategory::class)->execute($user, $name, $type);
    }

    protected function moneySubcategory(MoneyCategory $category, string $name = 'Groceries'): MoneySubcategory
    {
        return app(CreateMoneySubcategory::class)->execute($category, $name);
    }

    protected function moneyTransaction(
        User $user,
        MoneyTransactionType $type,
        MoneyAccount $account,
        int $amountMinor,
        ?MoneyAccount $destination = null,
        ?MoneyCategory $category = null,
        ?MoneySubcategory $subcategory = null,
        string $date = '2026-08-18',
        ?string $note = null,
        int $feeMinor = 0,
    ): MoneyTransaction {
        return app(SaveMoneyTransaction::class)->create($user, new MoneyTransactionData(
            $type,
            $amountMinor,
            $account->id,
            $destination?->id,
            $category?->id,
            $subcategory?->id,
            CarbonImmutable::parse($date),
            $note,
            $feeMinor,
        ));
    }

    protected function moneySubscription(
        User $user,
        MoneyAccount $account,
        MoneyCategory $category,
        ?MoneySubcategory $subcategory = null,
        int $amountMinor = 1000,
        string $startsOn = '2026-08-18',
        MoneySubscriptionRecurrence $recurrence = MoneySubscriptionRecurrence::Monthly,
        MoneySubscriptionPaymentMode $paymentMode = MoneySubscriptionPaymentMode::Manual,
        ?string $endsOn = null,
        string $name = 'Internet',
    ): MoneySubscription {
        return app(SaveMoneySubscription::class)->create($user, new MoneySubscriptionData(
            name: $name,
            amountMinor: $amountMinor,
            accountId: $account->id,
            categoryId: $category->id,
            subcategoryId: $subcategory?->id,
            note: null,
            startsOn: CarbonImmutable::parse($startsOn),
            endsOn: $endsOn === null ? null : CarbonImmutable::parse($endsOn),
            recurrence: $recurrence,
            paymentMode: $paymentMode,
        ));
    }
}
