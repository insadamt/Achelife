<?php

namespace App\Services\Money;

use App\Data\Money\MoneyTransactionData;
use App\Enums\MoneyCategoryType;
use App\Enums\MoneyTransactionType;
use App\Models\MoneyAccount;
use App\Models\MoneyCategory;
use App\Models\MoneySubcategory;
use App\Models\MoneyTransaction;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Validation\ValidationException;

class MoneyTransactionValidator
{
    /** @return array{account: MoneyAccount, destination: ?MoneyAccount, category: ?MoneyCategory, subcategory: ?MoneySubcategory} */
    public function validate(User $user, MoneyTransactionData $data, ?MoneyTransaction $existing = null): array
    {
        if ($data->amountMinor <= 0) {
            $this->fail('amount', 'The amount must be greater than zero.');
        }

        if ($data->date->startOfDay()->isAfter(CarbonImmutable::today())) {
            $this->fail('date', 'Future Money transactions are not available in Phase 6.');
        }

        $account = $this->account($user, $data->accountId, 'account_id');
        $this->requireActiveUnlessUnchanged($account, $existing?->account_id, 'account_id');

        if ($data->type === MoneyTransactionType::Transfer) {
            return $this->validateTransfer($user, $data, $account, $existing);
        }

        return $this->validateIncomeOrExpense($user, $data, $account, $existing);
    }

    /** @return array{account: MoneyAccount, destination: MoneyAccount, category: null, subcategory: null} */
    private function validateTransfer(User $user, MoneyTransactionData $data, MoneyAccount $account, ?MoneyTransaction $existing): array
    {
        if ($data->categoryId !== null || $data->subcategoryId !== null) {
            $this->fail('category_id', 'Transfers do not use Categories or Subcategories.');
        }

        if ($data->destinationAccountId === null) {
            $this->fail('destination_account_id', 'Choose a destination Account.');
        }

        $destination = $this->account($user, $data->destinationAccountId, 'destination_account_id');
        $this->requireActiveUnlessUnchanged($destination, $existing?->destination_account_id, 'destination_account_id');

        if ($account->is($destination)) {
            $this->fail('destination_account_id', 'Source and destination Accounts must be different.');
        }

        if ($account->currency !== $destination->currency) {
            $this->fail('destination_account_id', 'Transfers require Accounts with the same currency. Currency conversion is not available.');
        }

        return ['account' => $account, 'destination' => $destination, 'category' => null, 'subcategory' => null];
    }

    /** @return array{account: MoneyAccount, destination: null, category: MoneyCategory, subcategory: ?MoneySubcategory} */
    private function validateIncomeOrExpense(User $user, MoneyTransactionData $data, MoneyAccount $account, ?MoneyTransaction $existing): array
    {
        if ($data->destinationAccountId !== null) {
            $this->fail('destination_account_id', 'Only Transfers use a destination Account.');
        }

        if ($data->categoryId === null) {
            $this->fail('category_id', 'Choose a Category.');
        }

        $category = $user->moneyCategories()->find($data->categoryId);
        if (! $category) {
            $this->fail('category_id', 'The selected Category does not belong to you.');
        }

        $expectedType = $data->type === MoneyTransactionType::Income
            ? MoneyCategoryType::Income
            : MoneyCategoryType::Expense;
        if ($category->type !== $expectedType) {
            $this->fail('category_id', "Choose an {$expectedType->value} Category for this transaction.");
        }

        $this->requireActiveUnlessUnchanged($category, $existing?->category_id, 'category_id');
        $subcategory = null;

        if ($data->subcategoryId !== null) {
            $subcategory = $user->moneySubcategories()->find($data->subcategoryId);
            if (! $subcategory || $subcategory->category_id !== $category->id) {
                $this->fail('subcategory_id', 'The selected Subcategory must belong to the chosen Category.');
            }
            $this->requireActiveUnlessUnchanged($subcategory, $existing?->subcategory_id, 'subcategory_id');
        }

        return ['account' => $account, 'destination' => null, 'category' => $category, 'subcategory' => $subcategory];
    }

    private function account(User $user, int $id, string $field): MoneyAccount
    {
        $account = $user->moneyAccounts()->find($id);
        if (! $account) {
            $this->fail($field, 'The selected Account does not belong to you.');
        }

        return $account;
    }

    private function requireActiveUnlessUnchanged(object $entity, ?int $existingId, string $field): void
    {
        if ($entity->archived_at !== null && $entity->id !== $existingId) {
            $this->fail($field, 'Archived items cannot be selected for new financial activity. Reactivate it first.');
        }

        if ($entity instanceof MoneySubcategory && $entity->category->archived_at !== null && $entity->id !== $existingId) {
            $this->fail($field, 'This Subcategory is unavailable because its parent Category is archived.');
        }
    }

    private function fail(string $field, string $message): never
    {
        throw ValidationException::withMessages([$field => $message]);
    }
}
