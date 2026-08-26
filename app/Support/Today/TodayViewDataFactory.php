<?php

namespace App\Support\Today;

use App\Actions\Habits\SynchronizeHabitOccurrences;
use App\Actions\Tasks\SynchronizeRecurringTaskOccurrences;
use App\Enums\HabitOccurrenceKind;
use App\Enums\HabitOccurrenceState;
use App\Models\Habit;
use App\Models\HabitOccurrence;
use App\Models\Season;
use App\Models\Task;
use App\Models\TodaySetting;
use App\Models\User;
use App\Services\Habits\HabitDefinitionResolver;
use App\Services\Habits\HabitSchedule;
use App\Services\Seasons\SeasonPointsAttributedOnDate;
use App\Support\Seasons\SeasonViewDataFactory;
use App\Support\Tasks\TaskViewDataFactory;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use LogicException;

class TodayViewDataFactory
{
    public function __construct(
        private readonly SynchronizeRecurringTaskOccurrences $synchronizeTasks,
        private readonly SynchronizeHabitOccurrences $synchronizeHabits,
        private readonly TaskViewDataFactory $taskViewDataFactory,
        private readonly HabitDefinitionResolver $habitDefinitionResolver,
        private readonly HabitSchedule $habitSchedule,
        private readonly SeasonViewDataFactory $seasonViewDataFactory,
        private readonly SeasonPointsAttributedOnDate $seasonPointsAttributedOnDate,
    ) {}

    /** @return array<string, mixed> */
    public function make(User $user, CarbonImmutable $today): array
    {
        $this->synchronizeTasks->execute($user, $today);
        $currentSeason = $this->synchronizeHabits->execute($user, $today);

        if ($currentSeason === null) {
            throw new LogicException('Today data requires an active Season.');
        }
        $settings = TodaySetting::query()->firstOrCreate(
            ['user_id' => $user->id],
            ['show_flexible_habits' => true, 'show_upcoming_tasks' => true],
        );

        $tasks = $this->tasks($user, $currentSeason, $today);
        $habits = $this->habits($user, $currentSeason, $today, $settings->show_flexible_habits);
        $diary = $this->diary($user, $today);
        $dailyProgress = $this->dailyProgress(
            $tasks['today'],
            $habits['required'],
            $diary,
            $this->seasonPointsAttributedOnDate->calculate($user, $currentSeason, $today),
        );

        $currentSeason = $currentSeason->refresh()->load('objectives');

        return [
            'today' => $today->toDateString(),
            'currentSeason' => $this->seasonViewDataFactory->forSeason($currentSeason, $today),
            'dailyProgress' => $dailyProgress,
            'tasks' => $tasks,
            'habits' => $habits,
            'diary' => $diary,
            'settings' => [
                'showFlexibleHabits' => $settings->show_flexible_habits,
            ],
        ];
    }

    /** @return array{today: Collection<int, array<string, mixed>>, overdue: Collection<int, array<string, mixed>>, overdueCount: int} */
    private function tasks(User $user, Season $season, CarbonImmutable $today): array
    {
        $relations = ['series', 'subtasks', 'reschedules', 'rewardSeason'];
        $baseQuery = $user->tasks();
        $visibleRecurringTaskIds = (clone $baseQuery)
            ->whereNotNull('task_series_id')
            ->whereNull('completed_at')
            ->whereDate('scheduled_date', '>=', $today)
            ->orderBy('scheduled_date')
            ->orderBy('id')
            ->get(['id', 'task_series_id'])
            ->unique('task_series_id')
            ->pluck('id');

        $todayTasks = (clone $baseQuery)->with($relations)
            ->whereDate('scheduled_date', $today)
            ->where(function (Builder $query) use ($visibleRecurringTaskIds): void {
                $query->whereNotNull('completed_at')
                    ->orWhereNull('task_series_id')
                    ->orWhereIn('id', $visibleRecurringTaskIds);
            })
            ->orderBy('completed_at')
            ->orderBy('created_at')
            ->get()
            ->map(fn (Task $task): array => $this->taskViewDataFactory->make($task, $today, $season->id));

        $overdueQuery = (clone $baseQuery)
            ->whereNull('completed_at')
            ->whereDate('scheduled_date', '<', $today);
        $overdueCount = (clone $overdueQuery)->count();
        $overdueTasks = $overdueQuery->with($relations)
            ->orderBy('scheduled_date')
            ->orderByDesc('important')
            ->limit(5)
            ->get()
            ->map(fn (Task $task): array => $this->taskViewDataFactory->make($task, $today, $season->id));

        return [
            'today' => $todayTasks,
            'overdue' => $overdueTasks,
            'overdueCount' => $overdueCount,
        ];
    }

    /** @return array{required: Collection<int, array<string, mixed>>, flexible: Collection<int, array<string, mixed>>} */
    private function habits(User $user, Season $season, CarbonImmutable $today, bool $showFlexible): array
    {
        $habits = $user->habits()
            ->whereNull('archived_at')
            ->with([
                'definitionVersions',
                'occurrences' => fn ($query) => $query->whereDate('occurrence_date', $today),
            ])
            ->orderBy('created_at')
            ->get();
        $required = collect();
        $flexible = collect();

        foreach ($habits as $habit) {
            $definition = $this->habitDefinitionResolver->fromLoadedVersions($habit->definitionVersions, $today);
            $isRequired = $this->habitSchedule->isRequired($definition, $today);
            $isFlexible = ! $isRequired && $this->habitSchedule->isFlexibleExtraAvailable($definition, $today);

            if (! $isRequired && (! $showFlexible || ! $isFlexible)) {
                continue;
            }

            $habitData = $this->habit($habit, $habit->occurrences->first(), $season, $today, $isRequired, $isFlexible);
            ($isRequired ? $required : $flexible)->push($habitData);
        }

        return ['required' => $required, 'flexible' => $flexible];
    }

    /** @return array<string, mixed> */
    private function habit(Habit $habit, ?HabitOccurrence $occurrence, Season $season, CarbonImmutable $today, bool $required, bool $flexible): array
    {
        $definition = $this->habitDefinitionResolver->fromLoadedVersions($habit->definitionVersions, $today);
        $day = [
            'date' => $today->toDateString(),
            'seasonDay' => $season->start_date->diffInDays($today) + 1,
            'calendarDay' => $today->day,
            'month' => $today->format('M'),
            'weekday' => $today->isoWeekday(),
            'state' => $occurrence?->state?->value,
            'kind' => $occurrence?->occurrence_kind->value ?? ($required ? HabitOccurrenceKind::Required->value : HabitOccurrenceKind::FlexibleExtra->value),
            'numericValue' => $occurrence?->numeric_value,
            'target' => $occurrence?->target_snapshot ?? $definition->numeric_target,
            'earnedSp' => $occurrence?->earned_sp ?? 0,
            'streakAfter' => $occurrence?->streak_after,
            'multiplier' => $occurrence?->reward_multiplier,
            'available' => true,
            'clickable' => true,
            'required' => $required,
            'flexibleExtra' => $flexible,
            'past' => false,
            'today' => true,
            'future' => false,
        ];
        $definitionData = [
            'difficulty' => $definition->difficulty->value,
            'baseReward' => $definition->difficulty->baseReward(),
            'scheduleType' => $definition->schedule_type->value,
            'weekdays' => $definition->weekdays ?? [],
            'flexible' => $definition->flexible,
            'numericTarget' => $definition->numeric_target,
        ];

        return [
            'id' => $habit->id,
            'name' => $habit->name,
            'type' => $habit->type->value,
            'unit' => $habit->unit,
            'startsOn' => $habit->starts_on->toDateString(),
            'currentStreak' => $habit->current_streak,
            ...$definitionData,
            'editDefinition' => $definitionData,
            'changesStartTomorrow' => false,
            'days' => [$day],
        ];
    }

    /** @return array<string, mixed> */
    private function diary(User $user, CarbonImmutable $today): array
    {
        $entry = $user->diaryEntries()->whereDate('entry_date', $today)->first();
        $streak = $entry?->is_completed
            ? $entry->streak_after
            : $user->diaryEntries()
                ->whereDate('entry_date', $today->subDay())
                ->where('is_completed', true)
                ->value('streak_after');

        return [
            'state' => $entry?->is_completed ? 'completed' : 'pending',
            'streak' => $streak ?? 0,
            'earnedSp' => $entry?->earned_sp ?? 0,
            'href' => '/diary?date='.$today->toDateString(),
        ];
    }

    /** @param Collection<int, array<string, mixed>> $todayTasks
     * @param  Collection<int, array<string, mixed>>  $requiredHabits
     * @param  array<string, mixed>  $diary
     * @return array<string, mixed>
     */
    private function dailyProgress(Collection $todayTasks, Collection $requiredHabits, array $diary, int $todaySp): array
    {
        $completedTasks = $todayTasks->where('state', 'completed')->count();
        $resolvedHabits = $requiredHabits->filter(function (array $habit): bool {
            $state = $habit['days'][0]['state'];

            return in_array($state, [HabitOccurrenceState::Completed->value, HabitOccurrenceState::Skipped->value], true);
        })->count();
        $total = $todayTasks->count() + $requiredHabits->count() + 1;
        $completed = $completedTasks + $resolvedHabits + ($diary['state'] === 'completed' ? 1 : 0);

        return [
            'completed' => $completed,
            'total' => $total,
            'percentage' => $total === 0 ? 0 : (int) round(($completed / $total) * 100),
            'todaySp' => $todaySp,
            'breakdown' => [
                'tasks' => ['completed' => $completedTasks, 'total' => $todayTasks->count()],
                'habits' => ['completed' => $resolvedHabits, 'total' => $requiredHabits->count()],
                'diary' => ['completed' => $diary['state'] === 'completed' ? 1 : 0, 'total' => 1],
            ],
        ];
    }
}
