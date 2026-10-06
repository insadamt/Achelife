<?php

namespace App\Services\Money;

use Illuminate\Database\Eloquent\Builder;

class MoneyPersonSummary
{
    /** @return list<array{currency: string, incomeMinor: int, expenseMinor: int}> */
    public function forFilteredTransactions(Builder $query): array
    {
        $totals = $query->whereNotNull('person_id')
            ->whereIn('type', ['income', 'expense'])
            ->whereDoesntHave('openedDebt')->whereDoesntHave('debtSettlement')
            ->join('money_accounts', 'money_accounts.id', '=', 'money_transactions.account_id')
            ->selectRaw('money_accounts.currency, money_transactions.type, SUM(money_transactions.amount_minor) AS total_minor')
            ->groupBy('money_accounts.currency', 'money_transactions.type')->orderBy('money_accounts.currency')->toBase()->get();

        return $totals->groupBy('currency')->map(fn ($rows, string $currency): array => [
            'currency' => $currency,
            'incomeMinor' => (int) ($rows->firstWhere('type', 'income')?->total_minor ?? 0),
            'expenseMinor' => (int) ($rows->firstWhere('type', 'expense')?->total_minor ?? 0),
        ])->values()->all();
    }
}
