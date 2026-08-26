<?php

namespace App\Http\Controllers;

use App\Actions\Seasons\ResolveUserSeasonCycle;
use App\Actions\Tasks\CreateTask;
use App\Actions\Tasks\DeleteTaskOccurrence;
use App\Actions\Tasks\SynchronizeRecurringTaskOccurrences;
use App\Actions\Tasks\UpdateTask;
use App\Data\Tasks\TaskData;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Models\Task;
use App\Services\Calendar\UserCalendar;
use App\Support\Tasks\TaskViewDataFactory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    public function index(
        Request $request,
        SynchronizeRecurringTaskOccurrences $synchronizeOccurrences,
        ResolveUserSeasonCycle $resolveUserSeasonCycle,
        TaskViewDataFactory $viewDataFactory,
        UserCalendar $calendar,
    ): Response {
        $today = $calendar->today($request->user());
        $synchronizeOccurrences->execute($request->user(), $today);
        $cycle = $resolveUserSeasonCycle->execute($request->user(), $today);
        $currentSeasonId = $cycle->activeSeason?->id;
        $relations = ['series', 'subtasks', 'reschedules', 'rewardSeason'];
        $tasks = $request->user()->tasks();
        $visibleRecurringTaskIds = (clone $tasks)
            ->whereNotNull('task_series_id')
            ->whereNull('completed_at')
            ->whereDate('scheduled_date', '>=', $today)
            ->orderBy('scheduled_date')
            ->orderBy('id')
            ->get(['id', 'task_series_id'])
            ->unique('task_series_id')
            ->pluck('id');

        $todayTasks = (clone $tasks)->with($relations)
            ->whereDate('scheduled_date', $today)
            ->whereNull('completed_at')
            ->where(function ($query) use ($visibleRecurringTaskIds): void {
                $query->whereNull('task_series_id')
                    ->orWhereIn('id', $visibleRecurringTaskIds);
            })
            ->orderBy('created_at')
            ->get()
            ->map(fn (Task $task) => $viewDataFactory->make($task, $today, $currentSeasonId));

        $upcomingTasks = (clone $tasks)->with($relations)
            ->whereNull('completed_at')
            ->whereDate('scheduled_date', '>', $today)
            ->where(function ($query) use ($visibleRecurringTaskIds): void {
                $query->whereNull('task_series_id')
                    ->orWhereIn('id', $visibleRecurringTaskIds);
            })
            ->orderBy('scheduled_date')
            ->orderByDesc('important')
            ->get()
            ->map(fn (Task $task) => $viewDataFactory->make($task, $today, $currentSeasonId));

        $overdueTasks = (clone $tasks)->with($relations)
            ->whereNull('completed_at')
            ->whereDate('scheduled_date', '<', $today)
            ->orderBy('scheduled_date')
            ->paginate(50, ['*'], 'overdue_page')
            ->withQueryString()
            ->through(fn (Task $task) => $viewDataFactory->make($task, $today, $currentSeasonId));

        $completedTasks = (clone $tasks)->with($relations)
            ->whereNotNull('completed_at')
            ->orderByDesc('completed_at')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Task $task) => $viewDataFactory->make($task, $today, $currentSeasonId));

        return Inertia::render('tasks/Index', [
            'today' => $today->toDateString(),
            'todayTasks' => $todayTasks,
            'upcomingTasks' => $upcomingTasks,
            'overdueTasks' => $overdueTasks,
            'completedTasks' => $completedTasks,
            'intermission' => $cycle->activeSeason === null,
        ]);
    }

    public function store(StoreTaskRequest $request, CreateTask $createTask): RedirectResponse
    {
        $createTask->execute($request->user(), TaskData::fromValidated($request->validated()));

        return back();
    }

    public function update(UpdateTaskRequest $request, Task $task, UpdateTask $updateTask): RedirectResponse
    {
        $updateTask->execute($task, TaskData::fromValidated($request->validated()));

        return back();
    }

    public function destroy(Request $request, Task $task, DeleteTaskOccurrence $deleteTask): RedirectResponse
    {
        Gate::authorize('delete', $task);
        $deleteTask->execute($task);

        return back();
    }
}
