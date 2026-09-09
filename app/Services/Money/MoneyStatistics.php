<?php

namespace App\Services\Money;

use App\Data\Seasons\SeasonCycleResult;
use App\Data\Statistics\StatisticsPeriod;
use App\Enums\MoneyTransactionType;
use App\Models\MoneyAccount;
use App\Models\MoneyTransaction;
use App\Models\User;
use App\Services\Calendar\UserCalendar;
use App\Services\Statistics\StatisticsPeriodResolver;
use App\Support\Money\MoneyPresetPack;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class MoneyStatistics
{
    public function __construct(
        private readonly UserCalendar $calendar,
        private readonly StatisticsPeriodResolver $periods,
    ) {}

    /** @return array<string, mixed> */
    public function summarize(
        User $user,
        SeasonCycleResult $cycle,
        string $filter,
        ?string $selectionValue,
        ?string $requestedCurrency,
        ?int $requestedAccountId,
    ): array {
        $today = $this->calendar->today($user);
        $period = $this->periods->resolve($user, $cycle, $today, $filter, $selectionValue);
        $allAccounts = $user->moneyAccounts()->orderBy('name')->get();
        $currencies = $allAccounts->pluck('currency')->unique()->sort()->values();
        $defaultCurrency = $allAccounts->sortBy('id')->first()?->currency;
        $currency = $currencies->contains($requestedCurrency) ? $requestedCurrency : $defaultCurrency;
        $currencyAccounts = $allAccounts->where('currency', $currency)->values();
        $selectedAccount = $requestedAccountId === null
            ? null
            : $currencyAccounts->firstWhere('id', $requestedAccountId);
        $scopedAccounts = $selectedAccount ? collect([$selectedAccount]) : $currencyAccounts;
        $transactions = $this->transactions($user, $scopedAccounts, $period);
        $feeProjection = $this->feeProjection($user);
        $current = $this->summarizePeriod($user, $scopedAccounts, $transactions, $period->start, $period->end, $today, $feeProjection);
        $previous = $period->previousStart === null
            ? null
            : $this->summarizePeriod($user, $scopedAccounts, $transactions, $period->previousStart, $period->previousEnd, $today, $feeProjection);

        return [
            'filter' => $filter,
            'label' => $period->label,
            'comparisonLabel' => $period->comparisonLabel,
            'selector' => [
                'value' => $period->selectionValue,
                'previousValue' => $period->previousSelectionValue,
                'nextValue' => $period->nextSelectionValue,
            ],
            'range' => [
                'start' => $period->start?->toDateString(),
                'end' => $period->end->toDateString(),
            ],
            'currency' => $currency,
            'currencies' => $currencies,
            'accountId' => $selectedAccount?->id,
            'accounts' => $currencyAccounts->map(fn (MoneyAccount $account): array => [
                'id' => $account->id,
                'name' => $account->name,
                'archived' => $account->archived_at !== null,
            ])->values(),
            'current' => $current,
            'previous' => $previous,
            'trend' => $this->buildTrend($period, $current['daily'], $previous['daily'] ?? [], $today),
        ];
    }

    /** @param Collection<int, MoneyAccount> $accounts
     * @return Collection<int, MoneyTransaction>
     */
    private function transactions(User $user, Collection $accounts, StatisticsPeriod $period): Collection
    {
        if ($accounts->isEmpty()) {
            return collect();
        }

        $accountIds = $accounts->pluck('id');
        $query = $user->moneyTransactions()
            ->where(fn ($accountsQuery) => $accountsQuery
                ->whereIn('account_id', $accountIds)
                ->orWhereIn('destination_account_id', $accountIds))
            ->whereDate('transaction_date', '<=', $period->end)
            ->with(['category:id,name', 'subcategory:id,name', 'subscriptionOccurrence:id,transaction_id']);
        $queryStart = $period->previousStart ?? $period->start;

        if ($queryStart !== null) {
            $query->whereDate('transaction_date', '>=', $queryStart);
        }

        return $query->orderBy('transaction_date')->orderBy('id')->get();
    }

    /** @param Collection<int, MoneyAccount> $accounts
     * @param  Collection<int, MoneyTransaction>  $transactions
     * @param  array<string, mixed>  $feeProjection
     * @return array<string, mixed>
     */
    private function summarizePeriod(
        User $user,
        Collection $accounts,
        Collection $transactions,
        ?CarbonImmutable $start,
        CarbonImmutable $end,
        CarbonImmutable $today,
        array $feeProjection,
    ): array {
        $summary = $this->emptySummary($accounts);

        foreach ($accounts as $account) {
            $openingDate = CarbonImmutable::parse(
                CarbonImmutable::parse($account->created_at)->setTimezone($user->timezone)->toDateString(),
                'UTC',
            );

            if (! $this->contains($openingDate, $start, $end)) {
                continue;
            }

            $summary['openingBalanceMinor'] += $account->initial_balance_minor;
            $summary['totalIncomeMinor'] += $account->initial_balance_minor;
            $summary['daily'][$openingDate->toDateString()] ??= $this->emptyDailyTotal();
            $summary['daily'][$openingDate->toDateString()]['openingBalanceMinor'] += $account->initial_balance_minor;
            $summary['accounts'][$account->id]['moneyInMinor'] += $account->initial_balance_minor;
            $summary['incomeBreakdown']['opening-balances'] ??= [
                'key' => 'opening-balances',
                'categoryId' => null,
                'name' => 'Opening balances',
                'amountMinor' => 0,
                'subcategories' => [],
            ];
            $summary['incomeBreakdown']['opening-balances']['amountMinor'] += $account->initial_balance_minor;
        }

        foreach ($transactions as $transaction) {
            $date = CarbonImmutable::parse($transaction->transaction_date->toDateString(), 'UTC');

            if (! $this->contains($date, $start, $end)) {
                continue;
            }

            $summary['transactionCount']++;
            $dateKey = $date->toDateString();
            $summary['daily'][$dateKey] ??= $this->emptyDailyTotal();

            match ($transaction->type) {
                MoneyTransactionType::Income => $this->addIncome($summary, $transaction, $dateKey),
                MoneyTransactionType::Expense => $this->addExpense($summary, $transaction, $dateKey),
                MoneyTransactionType::Transfer => $this->addTransfer($summary, $transaction, $dateKey, $feeProjection),
            };
        }

        return $this->finalizeSummary($summary, $start, $end, $today);
    }

    /** @param array<string, mixed> $summary */
    private function addIncome(array &$summary, MoneyTransaction $transaction, string $date): void
    {
        $summary['recordedIncomeMinor'] += $transaction->amount_minor;
        $summary['totalIncomeMinor'] += $transaction->amount_minor;
        $summary['daily'][$date]['incomeMinor'] += $transaction->amount_minor;
        $summary['accounts'][$transaction->account_id]['moneyInMinor'] += $transaction->amount_minor;
        $this->addBreakdown($summary['incomeBreakdown'], $transaction, $transaction->amount_minor, 'Uncategorized income');
    }

    /** @param array<string, mixed> $summary */
    private function addExpense(array &$summary, MoneyTransaction $transaction, string $date): void
    {
        $summary['spendingMinor'] += $transaction->amount_minor;
        $summary['daily'][$date]['spendingMinor'] += $transaction->amount_minor;
        $summary['accounts'][$transaction->account_id]['spendingMinor'] += $transaction->amount_minor;
        $this->addBreakdown($summary['spendingBreakdown'], $transaction, $transaction->amount_minor, 'Uncategorized expense');

        if ($transaction->subscriptionOccurrence !== null) {
            $summary['subscriptionSpendingMinor'] += $transaction->amount_minor;
        }
    }

    /** @param array<string, mixed> $summary */
    private function addTransfer(array &$summary, MoneyTransaction $transaction, string $date, array $feeProjection): void
    {
        if (isset($summary['accounts'][$transaction->account_id])) {
            $summary['accounts'][$transaction->account_id]['transferredOutMinor'] += $transaction->amount_minor;
        }

        if ($transaction->destination_account_id !== null && isset($summary['accounts'][$transaction->destination_account_id])) {
            $summary['accounts'][$transaction->destination_account_id]['transferredInMinor'] += $transaction->amount_minor;
        }

        if ($transaction->fee_minor === 0 || ! isset($summary['accounts'][$transaction->account_id])) {
            return;
        }

        $summary['spendingMinor'] += $transaction->fee_minor;
        $summary['transferFeesMinor'] += $transaction->fee_minor;
        $summary['daily'][$date]['spendingMinor'] += $transaction->fee_minor;
        $summary['accounts'][$transaction->account_id]['spendingMinor'] += $transaction->fee_minor;
        $this->addProjectedFee($summary['spendingBreakdown'], $transaction->fee_minor, $feeProjection);
    }

    /** @param array<string, array<string, mixed>> $breakdown */
    private function addBreakdown(array &$breakdown, MoneyTransaction $transaction, int $amountMinor, string $fallback): void
    {
        $key = $transaction->category_id === null ? "uncategorized:{$transaction->type->value}" : "category:{$transaction->category_id}";
        $breakdown[$key] ??= [
            'key' => $key,
            'categoryId' => $transaction->category_id,
            'name' => $transaction->category?->name ?? $fallback,
            'amountMinor' => 0,
            'subcategories' => [],
        ];
        $breakdown[$key]['amountMinor'] += $amountMinor;

        if ($transaction->subcategory_id === null) {
            return;
        }

        $subcategoryKey = "subcategory:{$transaction->subcategory_id}";
        $breakdown[$key]['subcategories'][$subcategoryKey] ??= [
            'key' => $subcategoryKey,
            'subcategoryId' => $transaction->subcategory_id,
            'name' => $transaction->subcategory?->name ?? 'Uncategorized',
            'amountMinor' => 0,
        ];
        $breakdown[$key]['subcategories'][$subcategoryKey]['amountMinor'] += $amountMinor;
    }

    /** @param array<string, array<string, mixed>> $breakdown */
    private function addProjectedFee(array &$breakdown, int $amountMinor, array $projection): void
    {
        $breakdown[$projection['categoryKey']] ??= [
            'key' => $projection['categoryKey'],
            'categoryId' => $projection['categoryId'],
            'name' => $projection['categoryName'],
            'amountMinor' => 0,
            'subcategories' => [
                $projection['subcategoryKey'] => [
                    'key' => $projection['subcategoryKey'],
                    'subcategoryId' => $projection['subcategoryId'],
                    'name' => $projection['subcategoryName'],
                    'amountMinor' => 0,
                ],
            ],
            'includesProjectedFees' => true,
        ];
        $breakdown[$projection['categoryKey']]['includesProjectedFees'] = true;
        $breakdown[$projection['categoryKey']]['subcategories'][$projection['subcategoryKey']] ??= [
            'key' => $projection['subcategoryKey'],
            'subcategoryId' => $projection['subcategoryId'],
            'name' => $projection['subcategoryName'],
            'amountMinor' => 0,
        ];
        $breakdown[$projection['categoryKey']]['amountMinor'] += $amountMinor;
        $breakdown[$projection['categoryKey']]['subcategories'][$projection['subcategoryKey']]['amountMinor'] += $amountMinor;
    }

    /** @return array<string, mixed> */
    private function feeProjection(User $user): array
    {
        $category = $user->moneyCategories()->where('preset_key', MoneyPresetPack::FINANCIAL_CATEGORY_KEY)->first();
        $subcategory = $user->moneySubcategories()->where('preset_key', MoneyPresetPack::BANK_FEES_SUBCATEGORY_KEY)->first();

        return [
            'categoryKey' => $category ? "category:{$category->id}" : 'transfer-fees',
            'categoryId' => $category?->id,
            'categoryName' => $category?->name ?? 'Financial',
            'subcategoryKey' => $subcategory ? "subcategory:{$subcategory->id}" : 'bank-fees',
            'subcategoryId' => $subcategory?->id,
            'subcategoryName' => $subcategory?->name ?? 'Bank Fees',
        ];
    }

    /** @param Collection<int, MoneyAccount> $accounts
     * @return array<string, mixed>
     */
    private function emptySummary(Collection $accounts): array
    {
        return [
            'totalIncomeMinor' => 0,
            'recordedIncomeMinor' => 0,
            'openingBalanceMinor' => 0,
            'spendingMinor' => 0,
            'netCashFlowMinor' => 0,
            'savingsRate' => null,
            'transactionCount' => 0,
            'averageDailySpendingMinor' => 0,
            'noSpendDays' => 0,
            'elapsedDays' => 0,
            'noSpendRate' => null,
            'subscriptionSpendingMinor' => 0,
            'transferFeesMinor' => 0,
            'highestSpendingDay' => null,
            'incomeBreakdown' => [],
            'spendingBreakdown' => [],
            'accounts' => $accounts->mapWithKeys(fn (MoneyAccount $account): array => [$account->id => [
                'id' => $account->id,
                'name' => $account->name,
                'archived' => $account->archived_at !== null,
                'moneyInMinor' => 0,
                'spendingMinor' => 0,
                'transferredInMinor' => 0,
                'transferredOutMinor' => 0,
                'netMovementMinor' => 0,
            ]])->all(),
            'daily' => [],
        ];
    }

    /** @param array<string, mixed> $summary
     * @return array<string, mixed>
     */
    private function finalizeSummary(array $summary, ?CarbonImmutable $start, CarbonImmutable $end, CarbonImmutable $today): array
    {
        $summary['netCashFlowMinor'] = $summary['totalIncomeMinor'] - $summary['spendingMinor'];
        $summary['savingsRate'] = $summary['totalIncomeMinor'] > 0
            ? round($summary['netCashFlowMinor'] / $summary['totalIncomeMinor'] * 100, 1)
            : null;
        $effectiveStart = $start ?? $this->earliestActivityDate($summary['daily'], $end);
        $effectiveEnd = $end->min($today);
        $days = max(1, $effectiveStart->diffInDays($effectiveEnd) + 1);
        $summary['elapsedDays'] = $days;
        $summary['averageDailySpendingMinor'] = (int) round($summary['spendingMinor'] / $days);
        $spendingDays = collect($summary['daily'])->filter(fn (array $daily): bool => ($daily['spendingMinor'] ?? 0) > 0)->count();
        $summary['noSpendDays'] = max(0, $days - $spendingDays);
        $summary['noSpendRate'] = round($summary['noSpendDays'] / $days * 100, 1);
        $highestDate = null;
        $highestAmount = 0;
        foreach ($summary['daily'] as $date => $daily) {
            if (($daily['spendingMinor'] ?? 0) > $highestAmount) {
                $highestDate = $date;
                $highestAmount = $daily['spendingMinor'];
            }
        }
        $summary['highestSpendingDay'] = $highestDate === null ? null : ['date' => $highestDate, 'amountMinor' => $highestAmount];
        $summary['incomeBreakdown'] = $this->finalizeBreakdown($summary['incomeBreakdown']);
        $summary['spendingBreakdown'] = $this->finalizeBreakdown($summary['spendingBreakdown']);

        foreach ($summary['accounts'] as &$account) {
            $account['netMovementMinor'] = $account['moneyInMinor'] - $account['spendingMinor']
                + $account['transferredInMinor'] - $account['transferredOutMinor'];
        }
        unset($account);
        $summary['accounts'] = array_values($summary['accounts']);

        return $summary;
    }

    /** @param array<string, array<string, mixed>> $breakdown
     * @return list<array<string, mixed>>
     */
    private function finalizeBreakdown(array $breakdown): array
    {
        foreach ($breakdown as &$item) {
            $item['subcategories'] = array_values($item['subcategories']);
            usort($item['subcategories'], fn (array $left, array $right): int => $right['amountMinor'] <=> $left['amountMinor']);
        }
        unset($item);
        usort($breakdown, fn (array $left, array $right): int => $right['amountMinor'] <=> $left['amountMinor']);

        return array_values($breakdown);
    }

    /** @param array<string, array<string, int>> $daily */
    private function earliestActivityDate(array $daily, CarbonImmutable $fallback): CarbonImmutable
    {
        if ($daily === []) {
            return $fallback;
        }

        return CarbonImmutable::parse(min(array_keys($daily)), 'UTC');
    }

    /** @param array<string, array<string, int>> $currentDaily
     * @param  array<string, array<string, int>>  $previousDaily
     * @return array<string, mixed>
     */
    private function buildTrend(StatisticsPeriod $period, array $currentDaily, array $previousDaily, CarbonImmutable $today): array
    {
        $start = $period->start ?? $this->earliestActivityDate($currentDaily, $today);
        $end = $period->end->min($today);
        $unit = in_array($period->key, ['season', 'month'], true) ? 'day' : 'month';

        if ($period->key === 'all' && $start->diffInMonths($end) > 36) {
            $unit = 'year';
        }

        return [
            'unit' => $unit,
            'current' => $this->trendBuckets($start, $end, $unit, $currentDaily),
            'previous' => $period->previousStart === null
                ? null
                : $this->trendBuckets($period->previousStart, $period->previousEnd, $unit, $previousDaily),
        ];
    }

    /** @param array<string, array<string, int>> $daily
     * @return list<array<string, mixed>>
     */
    private function trendBuckets(CarbonImmutable $start, CarbonImmutable $end, string $unit, array $daily): array
    {
        $format = match ($unit) {
            'day' => 'Y-m-d',
            'month' => 'Y-m',
            default => 'Y',
        };
        $activity = [];

        foreach ($daily as $date => $values) {
            $key = CarbonImmutable::parse($date, 'UTC')->format($format);
            $activity[$key] ??= $this->emptyDailyTotal();
            $activity[$key]['incomeMinor'] += $values['incomeMinor'] ?? 0;
            $activity[$key]['openingBalanceMinor'] += $values['openingBalanceMinor'] ?? 0;
            $activity[$key]['spendingMinor'] += $values['spendingMinor'] ?? 0;
        }

        $buckets = [];
        for ($date = $start->startOf($unit); $date <= $end; $date = $date->addUnit($unit)) {
            $key = $date->format($format);
            $values = $activity[$key] ?? $this->emptyDailyTotal();
            $moneyIn = $values['incomeMinor'] + $values['openingBalanceMinor'];
            $buckets[] = [
                'date' => $key,
                'label' => $date->format(match ($unit) {
                    'day' => 'M j',
                    'month' => 'M Y',
                    default => 'Y',
                }),
                'incomeMinor' => $values['incomeMinor'],
                'openingBalanceMinor' => $values['openingBalanceMinor'],
                'spendingMinor' => $values['spendingMinor'],
                'netMinor' => $moneyIn - $values['spendingMinor'],
            ];
        }

        return $buckets;
    }

    /** @return array{incomeMinor: int, openingBalanceMinor: int, spendingMinor: int} */
    private function emptyDailyTotal(): array
    {
        return ['incomeMinor' => 0, 'openingBalanceMinor' => 0, 'spendingMinor' => 0];
    }

    private function contains(CarbonImmutable $date, ?CarbonImmutable $start, CarbonImmutable $end): bool
    {
        return ($start === null || $date >= $start) && $date <= $end;
    }
}
