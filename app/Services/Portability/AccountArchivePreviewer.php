<?php

namespace App\Services\Portability;

use App\Data\Portability\ValidatedArchive;
use Carbon\CarbonImmutable;

class AccountArchivePreviewer
{
    public function __construct(private readonly ArchiveReader $reader) {}

    /** @return array<string, mixed> */
    public function preview(ValidatedArchive $archive): array
    {
        $manifest = $archive->manifest;
        $createdAt = CarbonImmutable::parse($manifest['created_at'])->utc();
        $timezone = data_get($manifest, 'user.timezone');
        $localToday = CarbonImmutable::now($timezone)->startOfDay();
        $latestSeason = $manifest['latest_season'];
        $catchUp = $latestSeason === null
            ? null
            : $this->catchUpPreview($archive, $localToday, $latestSeason);

        return [
            'createdAt' => $createdAt->toIso8601String(),
            'ageSeconds' => max(0, $createdAt->diffInSeconds(CarbonImmutable::now('UTC'))),
            'sourceApplication' => $manifest['source_application'],
            'sourceApplicationVersion' => $manifest['source_application_version'],
            'archiveFormatVersion' => $manifest['archive_format_version'],
            'timezone' => $timezone,
            'calendarStartedOn' => data_get($manifest, 'user.calendar_started_on'),
            'seasonRolloverPreference' => data_get($manifest, 'user.season_rollover_preference'),
            'latestSeason' => $latestSeason === null ? null : [
                'number' => $latestSeason['season_number'],
                'startDate' => $latestSeason['start_date'],
                'endDate' => $latestSeason['end_date'],
                'rank' => $latestSeason['rank'] ?? ($latestSeason['season_points'] < 0 ? 'unranked' : 'bronze_i'),
                'seasonPoints' => $latestSeason['season_points'],
                'finalized' => $latestSeason['finalized'],
            ],
            'countsByModule' => $manifest['module_counts'],
            'tableCounts' => $manifest['table_counts'],
            'catchUp' => $catchUp,
            'warnings' => [
                'Changes made after the backup date are not present.',
                'Restoring replaces this account snapshot; Achelife never merges divergent histories.',
                'This archive contains sensitive Diary writing and financial data.',
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $latestSeason
     * @return array<string, mixed>
     */
    private function catchUpPreview(ValidatedArchive $archive, CarbonImmutable $localToday, array $latestSeason): array
    {
        $seasonStart = $this->date($latestSeason['start_date']);
        $seasonEnd = $this->date($latestSeason['end_date']);
        $backupDate = $this->date($archive->manifest['created_local_date']);
        $through = $localToday->min($seasonEnd);
        $from = $backupDate->max($seasonStart);
        $hasWindow = ! $through->isBefore($from);

        return [
            'fromDate' => $from->toDateString(),
            'throughDate' => $hasWindow ? $through->toDateString() : null,
            'originalDay30' => $seasonEnd->toDateString(),
            'seasonHasEnded' => $localToday->isAfter($seasonEnd),
            'habitMisses' => $hasWindow ? $this->habitMisses($archive, $from, $through, $localToday) : 0,
            'diary' => $hasWindow ? $this->diaryEffects($archive, $from, $through, $localToday) : ['missedDays' => 0, 'resultingStreak' => $this->latestDiaryStreak($archive)],
            'recurringTaskOccurrences' => $hasWindow ? $this->recurringTaskOccurrences($archive, $through) : 0,
            'subscriptions' => $hasWindow ? $this->subscriptionCatchUp($archive, $from, $through) : ['automaticCount' => 0, 'automaticValueMinor' => 0, 'automaticValueMinorByCurrency' => []],
            'heldSeasonNumber' => (int) $latestSeason['season_number'] + 1,
        ];
    }

    private function habitMisses(ValidatedArchive $archive, CarbonImmutable $from, CarbonImmutable $through, CarbonImmutable $today): int
    {
        $habits = $this->keyedRows($archive, 'habits');
        $definitions = $this->groupedRows($archive, 'habit_definition_versions', 'habit_id');
        $occurrences = [];

        foreach ($this->rows($archive, 'habit_occurrences') as $occurrence) {
            $occurrences[(int) $occurrence['habit_id']][(string) $occurrence['occurrence_date']] = $occurrence['state'];
        }

        $misses = 0;

        foreach ($habits as $habitId => $habit) {
            if ($habit['archived_at'] !== null || $habit['deleted_at'] !== null) {
                continue;
            }

            $start = $from->max($this->date($habit['starts_on']));
            $end = $habit['inactive_on'] === null ? $through : $through->min($this->date($habit['inactive_on'])->subDay());

            for ($date = $start; $date->lessThanOrEqualTo($end); $date = $date->addDay()) {
                if (! $date->isBefore($today)) {
                    continue;
                }

                $storedState = $occurrences[$habitId][$date->toDateString()] ?? null;

                if ($storedState !== null && $storedState !== 'pending') {
                    continue;
                }

                $definition = $this->definitionOn($definitions[$habitId] ?? [], $date);

                if ($definition !== null && $this->habitIsRequired($definition, $date)) {
                    $misses++;
                }
            }
        }

        return $misses;
    }

    /** @return array{missedDays: int, resultingStreak: int} */
    private function diaryEffects(ValidatedArchive $archive, CarbonImmutable $from, CarbonImmutable $through, CarbonImmutable $today): array
    {
        $entries = [];

        foreach ($this->rows($archive, 'diary_entries') as $entry) {
            $entries[(string) $entry['entry_date']] = $entry;
        }

        $missedDays = 0;
        $streak = $this->latestDiaryStreak($archive);

        for ($date = $from; $date->lessThanOrEqualTo($through); $date = $date->addDay()) {
            $entry = $entries[$date->toDateString()] ?? null;

            if (($entry['is_completed'] ?? false) && $entry !== null) {
                $streak = (int) $entry['streak_after'];
            } elseif ($date->isBefore($today)) {
                $missedDays++;
                $streak = 0;
            }
        }

        return ['missedDays' => $missedDays, 'resultingStreak' => $streak];
    }

    private function latestDiaryStreak(ValidatedArchive $archive): int
    {
        $latest = null;

        foreach ($this->rows($archive, 'diary_entries') as $entry) {
            if ($latest === null || $entry['entry_date'] > $latest['entry_date']) {
                $latest = $entry;
            }
        }

        return (int) ($latest['streak_after'] ?? 0);
    }

    private function recurringTaskOccurrences(ValidatedArchive $archive, CarbonImmutable $through): int
    {
        $seriesRows = $this->rows($archive, 'task_series');
        $lastDates = [];

        foreach (['tasks' => 'task_series_id', 'task_series_exclusions' => 'task_series_id'] as $table => $foreignKey) {
            foreach ($this->rows($archive, $table) as $row) {
                if ($row[$foreignKey] === null) {
                    continue;
                }

                $dateValue = $table === 'tasks' ? $row['occurrence_date'] : $row['occurrence_date'];
                $seriesId = (int) $row[$foreignKey];

                if ($dateValue !== null && (! isset($lastDates[$seriesId]) || $dateValue > $lastDates[$seriesId])) {
                    $lastDates[$seriesId] = $dateValue;
                }
            }
        }

        $count = 0;

        foreach ($seriesRows as $series) {
            $candidate = isset($lastDates[$series['id']]) ? $this->date($lastDates[$series['id']])->addDay() : $this->date($series['starts_on']);
            $endsBefore = $series['ends_before'] === null ? null : $this->date($series['ends_before']);

            while ($candidate->lessThanOrEqualTo($through) && ($endsBefore === null || $candidate->isBefore($endsBefore))) {
                if ($series['recurrence_type'] === 'daily' || in_array($candidate->dayOfWeekIso, $this->jsonArray($series['weekdays']), true)) {
                    $count++;
                }

                $candidate = $candidate->addDay();
            }
        }

        return $count;
    }

    /** @return array{automaticCount: int, automaticValueMinor: int, automaticValueMinorByCurrency: array<string, int>} */
    private function subscriptionCatchUp(ValidatedArchive $archive, CarbonImmutable $from, CarbonImmutable $through): array
    {
        $accounts = $this->keyedRows($archive, 'money_accounts');
        $occurrences = [];
        $count = 0;
        $value = 0;
        $valuesByCurrency = [];

        foreach ($this->rows($archive, 'money_subscription_occurrences') as $row) {
            $occurrences[(int) $row['subscription_id']][(string) $row['due_date']] = $row;

            $dueDate = $this->date($row['due_date']);

            if ($row['status'] === 'due' && $row['payment_mode'] === 'automatic' && $row['automatic_retry_blocked_at'] === null && $dueDate->betweenIncluded($from, $through)) {
                $count++;
                $value += (int) $row['amount_minor'];
                $currency = $accounts[(int) $row['account_id']]['currency'];
                $valuesByCurrency[$currency] = ($valuesByCurrency[$currency] ?? 0) + (int) $row['amount_minor'];
            }
        }

        foreach ($this->rows($archive, 'money_subscriptions') as $subscription) {
            if ($subscription['status'] !== 'active' || $subscription['payment_mode'] !== 'automatic') {
                continue;
            }

            foreach ($this->subscriptionDates($subscription, $through) as $date) {
                if ($date->isBefore($from) || $date->isBefore($this->date($subscription['materialize_from'])) || isset($occurrences[$subscription['id']][$date->toDateString()])) {
                    continue;
                }

                $count++;
                $value += (int) $subscription['amount_minor'];
                $currency = $accounts[(int) $subscription['account_id']]['currency'];
                $valuesByCurrency[$currency] = ($valuesByCurrency[$currency] ?? 0) + (int) $subscription['amount_minor'];
            }
        }

        ksort($valuesByCurrency);

        return ['automaticCount' => $count, 'automaticValueMinor' => $value, 'automaticValueMinorByCurrency' => $valuesByCurrency];
    }

    /** @param array<string, mixed> $subscription
     * @return list<CarbonImmutable>
     */
    private function subscriptionDates(array $subscription, CarbonImmutable $through): array
    {
        $dates = [];
        $start = $this->date($subscription['starts_on']);
        $endsOn = $subscription['ends_on'] === null ? null : $this->date($subscription['ends_on']);

        for ($position = 0; ; $position++) {
            $date = match ($subscription['recurrence']) {
                'weekly' => $start->addWeeks($position),
                'monthly' => $this->anchoredMonth($start, (int) $subscription['anchor_day'], $position),
                'every_three_months' => $this->anchoredMonth($start, (int) $subscription['anchor_day'], $position * 3),
                'yearly' => $this->anchoredYear($start, (int) $subscription['anchor_day'], $position),
            };

            if ($date->isAfter($through) || ($endsOn !== null && $date->isAfter($endsOn))) {
                break;
            }

            $dates[] = $date;
        }

        return $dates;
    }

    private function anchoredMonth(CarbonImmutable $start, int $anchorDay, int $offset): CarbonImmutable
    {
        $month = $start->startOfMonth()->addMonths($offset);

        return $month->day(min($anchorDay, $month->daysInMonth));
    }

    private function anchoredYear(CarbonImmutable $start, int $anchorDay, int $offset): CarbonImmutable
    {
        $month = $start->startOfMonth()->addYears($offset);

        return $month->day(min($anchorDay, $month->daysInMonth));
    }

    /** @return list<array<string, mixed>> */
    private function rows(ValidatedArchive $archive, string $table): array
    {
        return iterator_to_array($this->reader->rows($archive->path, "tables/{$table}.ndjson"), false);
    }

    /** @return array<int, array<string, mixed>> */
    private function keyedRows(ValidatedArchive $archive, string $table): array
    {
        $rows = [];

        foreach ($this->rows($archive, $table) as $row) {
            $rows[(int) $row['id']] = $row;
        }

        return $rows;
    }

    /** @return array<int, list<array<string, mixed>>> */
    private function groupedRows(ValidatedArchive $archive, string $table, string $foreignKey): array
    {
        $groups = [];

        foreach ($this->rows($archive, $table) as $row) {
            $groups[(int) $row[$foreignKey]][] = $row;
        }

        return $groups;
    }

    /** @param list<array<string, mixed>> $definitions
     * @return array<string, mixed>|null
     */
    private function definitionOn(array $definitions, CarbonImmutable $date): ?array
    {
        $match = null;

        foreach ($definitions as $definition) {
            if ($this->date($definition['effective_from'])->lessThanOrEqualTo($date)) {
                $match = $definition;
            }
        }

        return $match;
    }

    /** @param array<string, mixed> $definition */
    private function habitIsRequired(array $definition, CarbonImmutable $date): bool
    {
        return $definition['schedule_type'] === 'every_day'
            || in_array($date->dayOfWeekIso, $this->jsonArray($definition['weekdays']), true);
    }

    /** @return list<int> */
    private function jsonArray(mixed $value): array
    {
        if (is_array($value)) {
            return array_map('intval', $value);
        }

        $decoded = json_decode((string) $value, true);

        return is_array($decoded) ? array_map('intval', $decoded) : [];
    }

    private function date(string $value): CarbonImmutable
    {
        return CarbonImmutable::createFromFormat('!Y-m-d', $value, 'UTC');
    }
}
