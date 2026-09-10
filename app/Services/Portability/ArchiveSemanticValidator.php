<?php

namespace App\Services\Portability;

use App\Data\Portability\PortableTableDefinition;
use App\Exceptions\InvalidAccountArchive;
use Carbon\CarbonImmutable;
use Throwable;

class ArchiveSemanticValidator
{
    /** @var array<string, array<int, true>> */
    private array $ids = [];

    /** @var array<int, array<string, mixed>> */
    private array $seasons = [];

    /** @var array<int, int> */
    private array $seasonContributions = [];

    /** @var array<int, array<string, mixed>> */
    private array $transactions = [];

    /** @var array<int, array<string, mixed>> */
    private array $subscriptions = [];

    /** @var array<int, array<string, mixed>> */
    private array $accounts = [];

    /** @var array<int, array<string, mixed>> */
    private array $debts = [];

    /** @var array<int, int> */
    private array $debtSettledAmounts = [];

    /** @var list<array<string, mixed>> */
    private array $intermissions = [];

    /** @var array<int, true> */
    private array $linkedTransactionIds = [];

    /** @var array<string, array<string, true>> */
    private array $presetKeys = ['money_categories' => [], 'money_subcategories' => []];

    /** @var array<string, mixed> */
    private array $manifestUser = [];

    public function __construct(
        private readonly PortableTableRegistry $tableRegistry,
        private readonly ArchiveReader $reader,
        private readonly ArchiveRowAdapter $rowAdapter,
    ) {}

    /** @param array<string, mixed> $manifest */
    public function validate(string $archivePath, array $manifest): void
    {
        $this->reset();
        $originalUserId = (int) data_get($manifest, 'user.original_id');
        $this->manifestUser = $manifest['user'];

        foreach ($this->tableRegistry->definitions((int) $manifest['archive_format_version']) as $definition) {
            $count = 0;

            foreach ($this->reader->rows($archivePath, $definition->path()) as $row) {
                $row = $this->rowAdapter->adapt(
                    (int) $manifest['archive_format_version'],
                    $definition->name,
                    $row,
                );
                $this->validateRow($definition, $row, $originalUserId);
                $count++;
            }

            if ($count !== (int) data_get($manifest, "table_counts.{$definition->name}", -1)) {
                throw new InvalidAccountArchive("{$definition->name} does not match its declared row count.");
            }

            if ($definition->name === 'users' && $count !== 1) {
                throw new InvalidAccountArchive('The archive must contain exactly one safe account profile row.');
            }

            if ($definition->identityColumn === null && $count > 1) {
                throw new InvalidAccountArchive("{$definition->name} contains duplicate settings rows.");
            }
        }

        $this->validateSeasonTimeline($manifest);
        $this->validateSeasonPointTotals();
    }

    /** @param array<string, mixed> $row */
    private function validateRow(PortableTableDefinition $definition, array $row, int $originalUserId): void
    {
        $unknownColumns = array_diff(array_keys($row), $definition->columns);
        $missingColumns = array_diff($definition->columns, array_keys($row));

        if ($unknownColumns !== [] || $missingColumns !== []) {
            throw new InvalidAccountArchive("{$definition->name} contains an unexpected row shape.");
        }

        if ($definition->identityColumn !== null) {
            $id = filter_var($row[$definition->identityColumn], FILTER_VALIDATE_INT);

            if ($id === false || $id < 1 || isset($this->ids[$definition->name][$id])) {
                throw new InvalidAccountArchive("{$definition->name} contains an invalid or duplicate ID.");
            }

            $this->ids[$definition->name][$id] = true;
        }

        if (array_key_exists('user_id', $row) && (int) $row['user_id'] !== $originalUserId) {
            throw new InvalidAccountArchive("{$definition->name} contains another user's data.");
        }

        if ($definition->name === 'users' && (int) $row['id'] !== $originalUserId) {
            throw new InvalidAccountArchive('The safe account profile does not match the archive owner.');
        }

        if ($definition->name === 'users') {
            foreach (['timezone', 'calendar_started_on', 'season_rollover_preference'] as $key) {
                if ((string) $row[$key] !== (string) ($this->manifestUser[$key] ?? null)) {
                    throw new InvalidAccountArchive('The safe account profile does not match the manifest.');
                }
            }

            if ((bool) $row['hold_next_season'] !== $this->manifestUser['hold_next_season']
                || (int) $row['money_preset_pack_version'] !== $this->manifestUser['money_preset_pack_version']) {
                throw new InvalidAccountArchive('The safe account profile does not match the manifest.');
            }
        }

        foreach ($definition->foreignKeys as $column => $referencedTable) {
            $foreignId = $row[$column];

            if ($foreignId !== null && ! isset($this->ids[$referencedTable][(int) $foreignId])) {
                throw new InvalidAccountArchive("{$definition->name}.{$column} references a missing record.");
            }
        }

        $this->captureDomainState($definition->name, $row);
    }

    /** @param array<string, mixed> $row */
    private function captureDomainState(string $table, array $row): void
    {
        if ($table === 'seasons') {
            $this->seasons[(int) $row['id']] = $row;
            $this->seasonContributions[(int) $row['id']] = 0;
        }

        if ($table === 'season_intermissions') {
            $this->intermissions[] = $row;
        }

        if ($table === 'tasks' && $row['reward_season_id'] !== null) {
            $this->addContribution((int) $row['reward_season_id'], (int) ($row['earned_sp'] ?? 0));
        } elseif ($table === 'habit_occurrences') {
            $this->assertDateInsideSeason($row, 'occurrence_date');
            $this->addContribution((int) $row['season_id'], (int) $row['earned_sp']);
        } elseif ($table === 'diary_entries') {
            $this->assertDateInsideSeason($row, 'entry_date');
            $this->addContribution((int) $row['season_id'], (int) $row['earned_sp']);
        } elseif ($table === 'violations') {
            $this->assertDateInsideSeason($row, 'violation_date');
            $this->addContribution((int) $row['season_id'], (int) $row['penalty_sp']);
        } elseif ($table === 'objectives' && $row['deleted_at'] === null) {
            $this->addContribution((int) $row['season_id'], (int) ($row['earned_sp'] ?? 0));
        } elseif ($table === 'money_accounts') {
            $this->accounts[(int) $row['id']] = $row;
        } elseif ($table === 'money_transactions') {
            $this->transactions[(int) $row['id']] = $row;
            $this->validateTransferFee($row);
        } elseif ($table === 'money_debts') {
            $this->validateMoneyDebt($row);
        } elseif ($table === 'money_debt_settlements') {
            $this->validateMoneyDebtSettlement($row);
        } elseif ($table === 'money_subscriptions') {
            $this->subscriptions[(int) $row['id']] = $row;
        } elseif ($table === 'money_subscription_occurrences') {
            $this->validateSubscriptionOccurrence($row);
        }

        if (isset($this->presetKeys[$table]) && $row['preset_key'] !== null) {
            $key = (string) $row['preset_key'];

            if ($key === '' || isset($this->presetKeys[$table][$key])) {
                throw new InvalidAccountArchive("{$table} contains a duplicate preset key.");
            }

            $this->presetKeys[$table][$key] = true;
        }
    }

    /** @param array<string, mixed> $row */
    private function assertDateInsideSeason(array $row, string $dateColumn): void
    {
        $season = $this->seasons[(int) $row['season_id']];
        $date = $this->date((string) $row[$dateColumn], $dateColumn);

        if ($date->isBefore($this->date((string) $season['start_date'], 'start_date')) || $date->isAfter($this->date((string) $season['end_date'], 'end_date'))) {
            throw new InvalidAccountArchive("{$dateColumn} falls outside its Season.");
        }
    }

    /** @param array<string, mixed> $row */
    private function validateTransferFee(array $row): void
    {
        $fee = (int) $row['fee_minor'];

        if ((int) $row['amount_minor'] < 1
            || $fee < 0
            || ($row['type'] !== 'transfer' && $fee !== 0)
            || ($row['type'] === 'transfer' && ($row['destination_account_id'] === null || $row['category_id'] !== null || $row['subcategory_id'] !== null))
            || ($row['type'] !== 'transfer' && $row['destination_account_id'] !== null)) {
            throw new InvalidAccountArchive('A Money transaction contains an invalid Transfer fee.');
        }
    }

    /** @param array<string, mixed> $row */
    private function validateSubscriptionOccurrence(array $row): void
    {
        $status = (string) $row['status'];
        $transactionId = $row['transaction_id'] === null ? null : (int) $row['transaction_id'];
        $subscription = $this->subscriptions[(int) $row['subscription_id']];
        $dueDate = $this->date((string) $row['due_date'], 'Subscription due date');

        if (! $this->isSubscriptionDate($subscription, $dueDate)
            || ($subscription['ends_on'] !== null && $dueDate->isAfter($this->date((string) $subscription['ends_on'], 'Subscription end date')))) {
            throw new InvalidAccountArchive('A Subscription occurrence has an impossible due date.');
        }

        if (($status === 'paid') !== ($transactionId !== null)) {
            throw new InvalidAccountArchive('A Subscription occurrence has an impossible payment link.');
        }

        if ($transactionId === null) {
            if ($status === 'skipped' && $row['skipped_at'] === null) {
                throw new InvalidAccountArchive('A skipped Subscription occurrence is missing its timestamp.');
            }

            return;
        }

        if (isset($this->linkedTransactionIds[$transactionId]) || $row['paid_at'] === null) {
            throw new InvalidAccountArchive('A Subscription payment transaction is linked more than once or lacks its timestamp.');
        }

        $this->linkedTransactionIds[$transactionId] = true;

        $transaction = $this->transactions[$transactionId];
        if ($transaction['type'] !== 'expense'
            || (int) $transaction['amount_minor'] !== (int) $row['amount_minor']
            || (int) $transaction['account_id'] !== (int) $row['account_id']
            || (int) $transaction['category_id'] !== (int) $row['category_id']
            || ($transaction['subcategory_id'] === null ? null : (int) $transaction['subcategory_id']) !== ($row['subcategory_id'] === null ? null : (int) $row['subcategory_id'])) {
            throw new InvalidAccountArchive('A Subscription occurrence does not match its payment snapshot.');
        }

    }

    /** @param array<string, mixed> $row */
    private function validateMoneyDebt(array $row): void
    {
        $direction = (string) $row['direction'];
        $amount = (int) $row['original_amount_minor'];
        $openedOn = $this->date((string) $row['opened_on'], 'Debt opening date');
        $dueOn = $row['due_on'] === null ? null : $this->date((string) $row['due_on'], 'Debt due date');
        $transactionId = $row['opening_transaction_id'] === null ? null : (int) $row['opening_transaction_id'];

        if (! in_array($direction, ['payable', 'receivable'], true)
            || $amount < 1
            || preg_match('/^[A-Z]{3}$/', (string) $row['currency']) !== 1
            || ($dueOn !== null && $dueOn->isBefore($openedOn))) {
            throw new InvalidAccountArchive('A Debt contains invalid terms.');
        }

        if ($transactionId !== null) {
            $expectedType = $direction === 'payable' ? 'income' : 'expense';
            $this->validateDebtTransaction($transactionId, $expectedType, $amount, (string) $row['currency']);
        }

        $this->debts[(int) $row['id']] = $row;
        $this->debtSettledAmounts[(int) $row['id']] = 0;
    }

    /** @param array<string, mixed> $row */
    private function validateMoneyDebtSettlement(array $row): void
    {
        $debtId = (int) $row['debt_id'];
        $debt = $this->debts[$debtId];
        $amount = (int) $row['amount_minor'];
        $settledOn = $this->date((string) $row['settled_on'], 'Debt settlement date');
        $transactionId = $row['transaction_id'] === null ? null : (int) $row['transaction_id'];

        if (! in_array($row['type'], ['repayment', 'forgiveness'], true)
            || $amount < 1
            || $settledOn->isBefore($this->date((string) $debt['opened_on'], 'Debt opening date'))
            || ($row['type'] === 'forgiveness' && $transactionId !== null)) {
            throw new InvalidAccountArchive('A Debt settlement is invalid.');
        }

        $this->debtSettledAmounts[$debtId] += $amount;
        if ($this->debtSettledAmounts[$debtId] > (int) $debt['original_amount_minor']) {
            throw new InvalidAccountArchive('A Debt is settled beyond its original amount.');
        }

        if ($transactionId !== null) {
            $expectedType = $debt['direction'] === 'payable' ? 'expense' : 'income';
            $this->validateDebtTransaction($transactionId, $expectedType, $amount, (string) $debt['currency']);
        }
    }

    private function validateDebtTransaction(int $transactionId, string $expectedType, int $amount, string $currency): void
    {
        if (isset($this->linkedTransactionIds[$transactionId])) {
            throw new InvalidAccountArchive('A Money transaction is linked to more than one protected financial record.');
        }

        $transaction = $this->transactions[$transactionId];
        $account = $this->accounts[(int) $transaction['account_id']];

        if ($transaction['type'] !== $expectedType
            || (int) $transaction['amount_minor'] !== $amount
            || (int) $transaction['fee_minor'] !== 0
            || $transaction['destination_account_id'] !== null
            || $transaction['category_id'] !== null
            || $transaction['subcategory_id'] !== null
            || $account['currency'] !== $currency) {
            throw new InvalidAccountArchive('A Debt Account movement does not match its debt record.');
        }

        $this->linkedTransactionIds[$transactionId] = true;
    }

    /** @param array<string, mixed> $manifest */
    private function validateSeasonTimeline(array $manifest): void
    {
        $ordered = collect($this->seasons)->sortBy('season_number')->values();
        $previous = null;

        if ($ordered->isEmpty()) {
            throw new InvalidAccountArchive('A portable account archive must contain at least one Season.');
        }

        foreach ($ordered as $season) {
            $start = $this->date((string) $season['start_date'], 'Season start date');
            $end = $this->date((string) $season['end_date'], 'Season end date');

            if ((int) $start->diffInDays($end) !== 29) {
                throw new InvalidAccountArchive('Every imported Season must last exactly 30 calendar days.');
            }

            if ($previous !== null
                && ((int) $season['season_number'] !== (int) $previous['season_number'] + 1
                    || ! $start->isAfter($this->date((string) $previous['end_date'], 'Season end date')))) {
                throw new InvalidAccountArchive('The imported Season timeline is impossible.');
            }

            $previous = $season;
        }

        if ($ordered->isNotEmpty() && (string) $ordered->first()['start_date'] !== (string) data_get($manifest, 'user.calendar_started_on')) {
            throw new InvalidAccountArchive('Season 1 does not match the saved calendar start.');
        }

        $latestManifest = $manifest['latest_season'] ?? null;

        if (($latestManifest === null) !== $ordered->isEmpty()) {
            throw new InvalidAccountArchive('The latest Season manifest state is inconsistent.');
        }

        if ($latestManifest !== null) {
            $latest = $ordered->last();

            foreach (['season_number', 'start_date', 'end_date', 'season_points', 'rank'] as $key) {
                if ((string) $latest[$key] !== (string) $latestManifest[$key]) {
                    throw new InvalidAccountArchive('The latest Season manifest state is inconsistent.');
                }
            }

            if (($latest['finalized_at'] !== null) !== $latestManifest['finalized']
                || $this->date((string) $manifest['created_local_date'], 'Backup local date')->isBefore($this->date((string) $latest['start_date'], 'Season start date'))) {
                throw new InvalidAccountArchive('The latest Season manifest state is inconsistent.');
            }
        }

        foreach ($this->intermissions as $intermission) {
            $season = $this->seasons[(int) $intermission['after_season_id']];
            $expectedStart = $this->date((string) $season['end_date'], 'Season end date')->addDay();
            $startedOn = $this->date((string) $intermission['started_on'], 'Intermission start date');
            $endedBefore = $intermission['ended_before'] === null ? null : $this->date((string) $intermission['ended_before'], 'Intermission end boundary');

            if (! in_array($intermission['reason'], ['manual_rollover', 'one_time_hold', 'restore'], true)
                || ! $startedOn->equalTo($expectedStart)
                || ($endedBefore !== null && ! $endedBefore->isAfter($startedOn))) {
                throw new InvalidAccountArchive('The imported intermission timeline is impossible.');
            }
        }
    }

    private function validateSeasonPointTotals(): void
    {
        foreach ($this->seasons as $id => $season) {
            if ((int) $season['season_points'] !== ($this->seasonContributions[$id] ?? 0)) {
                throw new InvalidAccountArchive("Season {$season['season_number']} has an invalid SP total.");
            }
        }
    }

    private function addContribution(int $seasonId, int $points): void
    {
        $this->seasonContributions[$seasonId] = ($this->seasonContributions[$seasonId] ?? 0) + $points;
    }

    /** @param array<string, mixed> $subscription */
    private function isSubscriptionDate(array $subscription, CarbonImmutable $dueDate): bool
    {
        $start = $this->date((string) $subscription['starts_on'], 'Subscription start date');

        if ($dueDate->isBefore($start)) {
            return false;
        }

        $anchorDay = (int) $subscription['anchor_day'];

        return match ($subscription['recurrence']) {
            'weekly' => ((int) $start->diffInDays($dueDate)) % 7 === 0,
            'monthly' => $this->matchesMonthAnchor($start, $dueDate, $anchorDay, 1),
            'every_three_months' => $this->matchesMonthAnchor($start, $dueDate, $anchorDay, 3),
            'yearly' => $dueDate->month === $start->month
                && $dueDate->day === min($anchorDay, $dueDate->daysInMonth),
            default => false,
        };
    }

    private function matchesMonthAnchor(CarbonImmutable $start, CarbonImmutable $dueDate, int $anchorDay, int $interval): bool
    {
        $months = (($dueDate->year - $start->year) * 12) + $dueDate->month - $start->month;

        return $months >= 0
            && $months % $interval === 0
            && $dueDate->day === min($anchorDay, $dueDate->daysInMonth);
    }

    private function date(string $value, string $label): CarbonImmutable
    {
        try {
            $date = CarbonImmutable::createFromFormat('!Y-m-d', $value, 'UTC');
        } catch (Throwable) {
            throw new InvalidAccountArchive("{$label} is invalid.");
        }

        if ($date === false || $date->toDateString() !== $value) {
            throw new InvalidAccountArchive("{$label} is invalid.");
        }

        return $date;
    }

    private function reset(): void
    {
        $this->ids = [];
        $this->seasons = [];
        $this->seasonContributions = [];
        $this->transactions = [];
        $this->subscriptions = [];
        $this->accounts = [];
        $this->debts = [];
        $this->debtSettledAmounts = [];
        $this->intermissions = [];
        $this->linkedTransactionIds = [];
        $this->presetKeys = ['money_categories' => [], 'money_subcategories' => []];
        $this->manifestUser = [];
    }
}
