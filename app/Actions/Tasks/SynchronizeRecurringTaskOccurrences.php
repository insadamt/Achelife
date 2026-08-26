<?php

namespace App\Actions\Tasks;

use App\Actions\Seasons\ResolveUserSeasonCycle;
use App\Enums\TaskRecurrenceType;
use App\Models\Task;
use App\Models\TaskSeries;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class SynchronizeRecurringTaskOccurrences
{
    public function __construct(private readonly ResolveUserSeasonCycle $resolveUserSeasonCycle) {}

    public function execute(User $user, CarbonImmutable $today): void
    {
        $cycle = $this->resolveUserSeasonCycle->execute($user, $today);

        if ($cycle->activeSeason === null) {
            $this->removeOpenIntermissionOccurrences($user, $cycle->intermission?->started_on);

            return;
        }

        $resumeOn = $user->seasonIntermissions()
            ->whereDate('ended_before', $cycle->activeSeason->start_date)
            ->latest('id')
            ->value('ended_before');
        $eligibleOnOrAfter = $resumeOn === null ? null : CarbonImmutable::parse($resumeOn);

        $user->taskSeries()->pluck('id')->each(
            fn (int $seriesId) => $this->synchronizeSeries(
                TaskSeries::query()->findOrFail($seriesId),
                $today->startOfDay(),
                $eligibleOnOrAfter,
            ),
        );
    }

    public function synchronizeSeries(TaskSeries $series, CarbonImmutable $today, ?CarbonImmutable $eligibleOnOrAfter = null): void
    {
        DB::transaction(function () use ($series, $today, $eligibleOnOrAfter): void {
            $lockedSeries = TaskSeries::query()->lockForUpdate()->findOrFail($series->id);
            $calendarDate = $today->startOfDay();

            while (! $this->hasPendingOccurrence($lockedSeries, $calendarDate)) {
                $nextOccurrenceDate = $this->nextOccurrenceDate($lockedSeries, $eligibleOnOrAfter);

                if ($nextOccurrenceDate === null) {
                    return;
                }

                $task = $lockedSeries->tasks()->create([
                    'user_id' => $lockedSeries->user_id,
                    'title' => $lockedSeries->title,
                    'scheduled_date' => $nextOccurrenceDate,
                    'occurrence_date' => $nextOccurrenceDate,
                    'important' => $lockedSeries->important,
                    'recurrence_type_snapshot' => $lockedSeries->recurrence_type,
                    'recurrence_weekdays_snapshot' => $lockedSeries->weekdays,
                ]);

                $this->createSubtaskSnapshot($task, $lockedSeries->subtask_template ?? []);
                $lockedSeries->update(['materialized_through' => $nextOccurrenceDate]);
            }
        });
    }

    private function hasPendingOccurrence(TaskSeries $series, CarbonImmutable $today): bool
    {
        return $series->tasks()
            ->whereNull('completed_at')
            ->whereDate('scheduled_date', '>=', $today)
            ->exists();
    }

    private function nextOccurrenceDate(TaskSeries $series, ?CarbonImmutable $eligibleOnOrAfter): ?CarbonImmutable
    {
        if ($series->recurrence_type === TaskRecurrenceType::Weekdays && $series->weekdays === []) {
            return null;
        }

        $lastKnownDate = collect([
            $series->tasks()->max('occurrence_date'),
            $series->exclusions()->max('occurrence_date'),
        ])
            ->filter()
            ->map(fn (string $date) => CarbonImmutable::parse($date)->startOfDay())
            ->sortByDesc(fn (CarbonImmutable $date) => $date->getTimestamp())
            ->first();
        $candidateDate = $lastKnownDate instanceof CarbonImmutable
            ? $lastKnownDate->addDay()
            : $series->starts_on;

        if ($eligibleOnOrAfter !== null && $candidateDate->isBefore($eligibleOnOrAfter)) {
            $candidateDate = $eligibleOnOrAfter;
        }

        while (! $this->isEligibleDate($series, $candidateDate)) {
            $candidateDate = $candidateDate->addDay();
        }

        if ($series->ends_before !== null && $candidateDate->gte($series->ends_before)) {
            return null;
        }

        return $candidateDate;
    }

    private function removeOpenIntermissionOccurrences(User $user, ?CarbonImmutable $startedOn): void
    {
        if ($startedOn === null) {
            return;
        }

        $user->tasks()
            ->whereNotNull('task_series_id')
            ->whereNull('completed_at')
            ->whereDate('occurrence_date', '>=', $startedOn)
            ->delete();
    }

    private function isEligibleDate(TaskSeries $series, CarbonImmutable $date): bool
    {
        return $series->recurrence_type === TaskRecurrenceType::Daily
            || in_array($date->dayOfWeekIso, $series->weekdays ?? [], true);
    }

    /** @param list<string> $subtaskTitles */
    private function createSubtaskSnapshot(Task $task, array $subtaskTitles): void
    {
        foreach ($subtaskTitles as $position => $title) {
            $task->subtasks()->create(['title' => $title, 'position' => $position]);
        }
    }
}
