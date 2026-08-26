<?php

namespace App\Services\Money;

use App\Enums\MoneyTransactionType;
use App\Models\MoneyAccount;
use App\Models\User;
use Illuminate\Support\Collection;

class AccountBalanceCalculator
{
    /** @param Collection<int, MoneyAccount> $accounts
     * @return array<int, int>
     */
    public function forAccounts(User $user, Collection $accounts): array
    {
        $balances = $accounts->mapWithKeys(fn (MoneyAccount $account): array => [
            $account->id => $account->initial_balance_minor,
        ])->all();

        if ($accounts->isEmpty()) {
            return $balances;
        }

        $accountIds = $accounts->pluck('id');
        $transactions = $user->moneyTransactions()
            ->where(function ($query) use ($accountIds): void {
                $query->whereIn('account_id', $accountIds)
                    ->orWhereIn('destination_account_id', $accountIds);
            })
            ->get(['type', 'amount_minor', 'fee_minor', 'account_id', 'destination_account_id']);

        foreach ($transactions as $transaction) {
            if (array_key_exists($transaction->account_id, $balances)) {
                $balances[$transaction->account_id] += match ($transaction->type) {
                    MoneyTransactionType::Income => $transaction->amount_minor,
                    MoneyTransactionType::Expense => -$transaction->amount_minor,
                    MoneyTransactionType::Transfer => -($transaction->amount_minor + $transaction->fee_minor),
                };
            }

            if ($transaction->type === MoneyTransactionType::Transfer
                && $transaction->destination_account_id !== null
                && array_key_exists($transaction->destination_account_id, $balances)) {
                $balances[$transaction->destination_account_id] += $transaction->amount_minor;
            }
        }

        return $balances;
    }

    /** @param Collection<int, MoneyAccount> $accounts
     * @param  array<int, int>  $balances
     * @return array<string, int>
     */
    public function totalsByCurrency(Collection $accounts, array $balances): array
    {
        $totals = [];

        foreach ($accounts as $account) {
            $totals[$account->currency] = ($totals[$account->currency] ?? 0) + $balances[$account->id];
        }

        ksort($totals);

        return $totals;
    }
}
