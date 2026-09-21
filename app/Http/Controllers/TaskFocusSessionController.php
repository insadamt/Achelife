<?php

namespace App\Http\Controllers;

use App\Actions\Tasks\CreateManualTaskFocusSession;
use App\Actions\Tasks\DeleteCompletedTaskFocusSession;
use App\Actions\Tasks\StartTaskFocusSession;
use App\Actions\Tasks\SwitchTaskFocusSession;
use App\Actions\Tasks\TransitionTaskFocusSession;
use App\Actions\Tasks\UpdateCompletedTaskFocusSession;
use App\Data\Tasks\ManualFocusSessionData;
use App\Enums\TaskFocusTransition;
use App\Exceptions\ActiveTaskFocusSessionExists;
use App\Http\Requests\StoreManualTaskFocusSessionRequest;
use App\Http\Requests\UpdateTaskFocusSessionRequest;
use App\Models\Task;
use App\Models\TaskFocusSession;
use App\Services\Tasks\LocalFocusTimestampParser;
use App\Support\Tasks\TaskFocusSessionViewDataFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class TaskFocusSessionController extends Controller
{
    public function store(
        Request $request,
        Task $task,
        StartTaskFocusSession $start,
        TaskFocusSessionViewDataFactory $viewDataFactory,
    ): JsonResponse {
        try {
            $session = $start->execute($request->user(), $task);
        } catch (ActiveTaskFocusSessionExists $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
                'activeSession' => $viewDataFactory->make($exception->session),
                'sessions' => $viewDataFactory->openForUser($request->user()),
            ], 409);
        }

        return response()->json([
            'session' => $viewDataFactory->make($session),
            'sessions' => $viewDataFactory->openForUser($request->user()),
        ], 201);
    }

    public function switchToTask(Request $request, Task $task, SwitchTaskFocusSession $switch, TaskFocusSessionViewDataFactory $viewDataFactory): JsonResponse
    {
        $session = $switch->execute($request->user(), $task);

        return response()->json([
            'session' => $viewDataFactory->make($session),
            'sessions' => $viewDataFactory->openForUser($request->user()),
        ]);
    }

    public function taskOptions(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('q', ''));

        if (mb_strlen($search) > 100) {
            throw ValidationException::withMessages(['q' => 'Search must be at most 100 characters.']);
        }

        $tasks = $request->user()->tasks()
            ->whereNull('completed_at')
            ->whereDoesntHave('focusSessions', fn ($query) => $query->where('active_marker', 1))
            ->when($search !== '', fn ($query) => $query->where('title', 'like', '%'.$search.'%'))
            ->with('project')
            ->orderByDesc('updated_at')
            ->limit(10)
            ->get()
            ->map(fn (Task $task): array => [
                'id' => $task->id,
                'title' => $task->title,
                'projectName' => $task->project?->name,
                'scheduledDate' => $task->scheduled_date->toDateString(),
            ]);

        return response()->json(['tasks' => $tasks]);
    }

    public function pause(Request $request, TaskFocusSession $session, TransitionTaskFocusSession $transition, TaskFocusSessionViewDataFactory $viewDataFactory): JsonResponse
    {
        return $this->transition($request, $session, TaskFocusTransition::Pause, $transition, $viewDataFactory);
    }

    public function resume(Request $request, TaskFocusSession $session, TransitionTaskFocusSession $transition, TaskFocusSessionViewDataFactory $viewDataFactory): JsonResponse
    {
        return $this->transition($request, $session, TaskFocusTransition::Resume, $transition, $viewDataFactory);
    }

    public function stop(Request $request, TaskFocusSession $session, TransitionTaskFocusSession $transition, TaskFocusSessionViewDataFactory $viewDataFactory): JsonResponse
    {
        return $this->transition($request, $session, TaskFocusTransition::Stop, $transition, $viewDataFactory);
    }

    public function storeManual(
        StoreManualTaskFocusSessionRequest $request,
        Task $task,
        CreateManualTaskFocusSession $create,
        LocalFocusTimestampParser $timestampParser,
    ): RedirectResponse {
        $create->execute($request->user(), $task, $this->manualData($request, $timestampParser));

        return back();
    }

    public function update(
        UpdateTaskFocusSessionRequest $request,
        TaskFocusSession $session,
        UpdateCompletedTaskFocusSession $update,
        LocalFocusTimestampParser $timestampParser,
    ): RedirectResponse {
        $update->execute($request->user(), $session, $this->manualData($request, $timestampParser));

        return back();
    }

    public function destroy(Request $request, TaskFocusSession $session, DeleteCompletedTaskFocusSession $delete): RedirectResponse
    {
        Gate::authorize('delete', $session);
        $delete->execute($request->user(), $session);

        return back();
    }

    private function transition(
        Request $request,
        TaskFocusSession $session,
        TaskFocusTransition $requestedTransition,
        TransitionTaskFocusSession $transition,
        TaskFocusSessionViewDataFactory $viewDataFactory,
    ): JsonResponse {
        try {
            $updatedSession = $transition->execute($request->user(), $session, $requestedTransition);
        } catch (ActiveTaskFocusSessionExists $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
                'activeSession' => $viewDataFactory->make($exception->session),
                'sessions' => $viewDataFactory->openForUser($request->user()),
            ], 409);
        }

        return response()->json([
            'session' => $viewDataFactory->make($updatedSession),
            'sessions' => $viewDataFactory->openForUser($request->user()),
        ]);
    }

    private function manualData(
        StoreManualTaskFocusSessionRequest|UpdateTaskFocusSessionRequest $request,
        LocalFocusTimestampParser $timestampParser,
    ): ManualFocusSessionData {
        $timezone = $request->user()->timezone;

        return new ManualFocusSessionData(
            $timestampParser->parse($request->validated('started_at'), $timezone, 'started_at'),
            $timestampParser->parse($request->validated('ended_at'), $timezone, 'ended_at'),
        );
    }
}
