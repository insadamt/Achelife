<?php

namespace App\Http\Controllers;

use App\Actions\Seasons\ResolveUserSeasonCycle;
use App\Actions\Tasks\RescheduleTaskOccurrence;
use App\Actions\Tasks\SynchronizeRecurringTaskOccurrences;
use App\Http\Requests\RescheduleTaskRequest;
use App\Models\Task;
use App\Services\Calendar\UserCalendar;
use App\Support\Tasks\TaskCalendarViewDataFactory;
use App\Support\Tasks\TaskExplorerViewDataFactory;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TaskCalendarController extends Controller
{
    public function index(Request $request, SynchronizeRecurringTaskOccurrences $synchronizeOccurrences, ResolveUserSeasonCycle $resolveUserSeasonCycle, TaskCalendarViewDataFactory $calendarViewDataFactory, TaskExplorerViewDataFactory $explorerViewDataFactory, UserCalendar $calendar): Response
    {
        $user = $request->user();
        $today = $calendar->today($user);
        $synchronizeOccurrences->execute($user, $today);
        $cycle = $resolveUserSeasonCycle->execute($user, $today);
        $view = match ($request->string('view')->toString()) {
            'week', 'three_day' => $request->string('view')->toString(),
            default => 'month',
        };
        $monthStart = $this->monthStart($request->string('month')->toString(), $today);
        $weekStart = $this->weekStart($request->string('week')->toString(), $today);
        $threeDayStart = $this->threeDayStart($request->string('three_day')->toString(), $today);
        [$periodStart, $periodEnd] = match ($view) {
            'week' => [$weekStart, $weekStart->addDays(6)],
            'three_day' => [$threeDayStart, $threeDayStart->addDays(2)],
            default => [$monthStart, $monthStart->endOfMonth()],
        };
        $projects = $user->taskProjects()->whereNull('archived_at')->where(function ($query): void {
            $query->whereNull('task_folder_id')->orWhereHas('folder', fn ($query) => $query->whereNull('archived_at'));
        })->orderBy('position')->get(['id', 'name', 'color']);
        [$projectIds, $includeInbox] = $this->selectedLocations($request, $projects->pluck('id')->all());
        $selectedDate = $this->selectedDate($request->string('date')->toString(), $periodStart, $periodEnd, $today);

        return Inertia::render('tasks/Calendar', [
            'today' => $today->toDateString(),
            'view' => $view,
            'month' => $monthStart->format('Y-m'),
            'weekStart' => $weekStart->toDateString(),
            'threeDayStart' => $threeDayStart->toDateString(),
            'selectedDate' => $selectedDate->toDateString(),
            'tasks' => $calendarViewDataFactory->make($user, $periodStart, $periodEnd, $projectIds, $includeInbox, $today, $cycle->activeSeason?->id),
            'projects' => $projects->map(fn ($project) => ['id' => $project->id, 'name' => $project->name, 'color' => $project->color])->values(),
            'selectedProjectIds' => $projectIds,
            'includeInbox' => $includeInbox,
            'explorer' => $explorerViewDataFactory->make($user),
            'intermission' => $cycle->activeSeason === null,
        ]);
    }

    public function reschedule(RescheduleTaskRequest $request, Task $task, RescheduleTaskOccurrence $rescheduleTask): RedirectResponse
    {
        abort_unless($task->visibleInWorkspace()->whereKey($task->id)->exists(), 404);
        $rescheduleTask->execute($task, CarbonImmutable::parse($request->validated('scheduled_date'))->startOfDay());

        return back();
    }

    private function monthStart(string $month, CarbonImmutable $today): CarbonImmutable
    {
        return preg_match('/^\\d{4}-(0[1-9]|1[0-2])$/', $month) === 1
            ? CarbonImmutable::createFromFormat('!Y-m', $month)
            : $today->startOfMonth();
    }

    private function weekStart(string $week, CarbonImmutable $today): CarbonImmutable
    {
        $anchor = $this->validDate($week) ?? $today;

        return $anchor->startOfWeek();
    }

    private function threeDayStart(string $threeDay, CarbonImmutable $today): CarbonImmutable
    {
        return $this->validDate($threeDay) ?? $today;
    }

    private function selectedDate(string $date, CarbonImmutable $monthStart, CarbonImmutable $monthEnd, CarbonImmutable $today): CarbonImmutable
    {
        $candidate = $this->validDate($date) ?? $today;

        return $candidate->betweenIncluded($monthStart, $monthEnd) ? $candidate : $monthStart;
    }

    private function validDate(string $date): ?CarbonImmutable
    {
        if (preg_match('/^\\d{4}-\\d{2}-\\d{2}$/', $date) !== 1) return null;

        $candidate = CarbonImmutable::createFromFormat('!Y-m-d', $date);

        return $candidate->format('Y-m-d') === $date ? $candidate : null;
    }

    /** @param list<int> $availableProjectIds
     *  @return array{list<int>, bool}
     */
    private function selectedLocations(Request $request, array $availableProjectIds): array
    {
        $requested = collect($request->input('projects', []))->map(fn ($value) => (string) $value);
        if ($requested->isEmpty()) return [$availableProjectIds, true];

        return [$requested->filter(fn ($value) => ctype_digit($value) && in_array((int) $value, $availableProjectIds, true))->map(fn ($value) => (int) $value)->values()->all(), $requested->contains('inbox')];
    }
}
