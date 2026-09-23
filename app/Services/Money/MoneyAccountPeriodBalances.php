<?php

namespace App\Services\Money;

use App\Enums\MoneyTransactionType;
use App\Models\MoneyAccount;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class MoneyAccountPeriodBalances
{
    /** @param array<string, mixed> $summary
     * @param array{opening: array<int, int>, closing: array<int, int>} $balances
     */
    public function apply(array &$summary, array $balances): void
    {
        foreach ($summary['accounts'] as &$account) {
            $account['periodOpeningBalanceMinor'] = $balances['opening'][$account['id']] ?? 0;
            $account['closingBalanceMinor'] = $balances['closing'][$account['id']] ?? 0;
        }
        unset($account);
    }

    /** @param Collection<int, MoneyAccount> $accounts
     * @return array{opening: array<int, int>, closing: array<int, int>}
     */
    public function forPeriod(User $user, Collection $accounts, ?CarbonImmutable $start, CarbonImmutable $end): array
    {
        return [
            'opening' => $this->asOf($user, $accounts, $start?->subDay()),
            'closing' => $this->asOf($user, $accounts, $end),
        ];
    }

    /** @param Collection<int, MoneyAccount> $accounts
     * @return array<int, int>
     */
    private function asOf(User $user, Collection $accounts, ?CarbonImmutable $date): array
    {
        $balances = [];
        foreach ($accounts as $account) {
            $createdOn = CarbonImmutable::parse(CarbonImmutable::parse($account->created_at)->setTimezone($user->timezone)->toDateString(), 'UTC');
            $balances[$account->id] = $date !== null && $createdOn->isAfter($date) ? 0 : $account->initial_balance_minor;
        }

        if ($accounts->isEmpty() || $date === null) {
            return $balances;
        }

        $accountIds = $accounts->pluck('id');
        $transactions = $user->moneyTransactions()
            ->where(fn ($query) => $query->whereIn('account_id', $accountIds)->orWhereIn('destination_account_id', $accountIds))
            ->whereDate('transaction_date', '<=', $date)
            ->get(['type', 'amount_minor', 'fee_minor', 'account_id', 'destination_account_id']);

        foreach ($transactions as $transaction) {
            if (isset($balances[$transaction->account_id])) {
                $balances[$transaction->account_id] += match ($transaction->type) {
                    MoneyTransactionType::Income => $transaction->amount_minor,
                    MoneyTransactionType::Expense => -$transaction->amount_minor,
                    MoneyTransactionType::Transfer => -($transaction->amount_minor + $transaction->fee_minor),
                };
            }

            if ($transaction->type === MoneyTransactionType::Transfer
                && $transaction->destination_account_id !== null
                && isset($balances[$transaction->destination_account_id])) {
                $balances[$transaction->destination_account_id] += $transaction->amount_minor;
            }
        }

        return $balances;
    }
}
