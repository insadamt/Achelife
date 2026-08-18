<?php

namespace App\Support\Money;

use App\Models\MoneyAccount;
use App\Models\MoneyCategory;
use App\Models\MoneyTransaction;

class MoneyViewDataFactory
{
    /** @return array<string, mixed> */
    public function account(MoneyAccount $account, int $balanceMinor): array
    {
        $hasHistory = ($account->transactions_count ?? $account->transactions()->count()) > 0
            || ($account->incoming_transfers_count ?? $account->incomingTransfers()->count()) > 0;

        return [
            'id' => $account->id,
            'name' => $account->name,
            'currency' => $account->currency,
            'initialBalanceMinor' => $account->initial_balance_minor,
            'balanceMinor' => $balanceMinor,
            'themeIndex' => $account->theme_index,
            'visualIdentifier' => $account->visual_identifier,
            'archivedAt' => $account->archived_at?->toIso8601String(),
            'hasHistory' => $hasHistory,
            'canDelete' => ! $hasHistory,
        ];
    }

    /** @return array<string, mixed> */
    public function category(MoneyCategory $category): array
    {
        return [
            'id' => $category->id,
            'name' => $category->name,
            'type' => $category->type->value,
            'builtIn' => $category->isCharity(),
            'archivedAt' => $category->archived_at?->toIso8601String(),
            'hasHistory' => ($category->transactions_count ?? $category->transactions()->count()) > 0,
            'subcategories' => $category->subcategories->map(fn ($subcategory): array => [
                'id' => $subcategory->id,
                'name' => $subcategory->name,
                'archivedAt' => $subcategory->archived_at?->toIso8601String(),
                'hasHistory' => ($subcategory->transactions_count ?? $subcategory->transactions()->count()) > 0,
            ])->values(),
        ];
    }

    /** @return array<string, mixed> */
    public function transaction(MoneyTransaction $transaction): array
    {
        return [
            'id' => $transaction->id,
            'type' => $transaction->type->value,
            'amountMinor' => $transaction->amount_minor,
            'date' => $transaction->transaction_date->toDateString(),
            'note' => $transaction->note,
            'account' => $this->transactionAccount($transaction->account),
            'destinationAccount' => $transaction->destinationAccount
                ? $this->transactionAccount($transaction->destinationAccount)
                : null,
            'category' => $transaction->category ? [
                'id' => $transaction->category->id,
                'name' => $transaction->category->name,
                'archived' => $transaction->category->archived_at !== null,
            ] : null,
            'subcategory' => $transaction->subcategory ? [
                'id' => $transaction->subcategory->id,
                'name' => $transaction->subcategory->name,
                'archived' => $transaction->subcategory->archived_at !== null,
            ] : null,
            'createdAt' => $transaction->created_at->toIso8601String(),
        ];
    }

    /** @return array{id: int, name: string, currency: string, archived: bool} */
    private function transactionAccount(MoneyAccount $account): array
    {
        return [
            'id' => $account->id,
            'name' => $account->name,
            'currency' => $account->currency,
            'archived' => $account->archived_at !== null,
        ];
    }
}
