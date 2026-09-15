<?php

namespace App\Http\Controllers;

use App\Actions\Tasks\CreateManualTaskFocusSession;
use App\Actions\Tasks\DeleteCompletedTaskFocusSession;
use App\Actions\Tasks\StartTaskFocusSession;
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
            ], 409);
        }

        return response()->json(['session' => $viewDataFactory->make($session)], 201);
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
        $updatedSession = $transition->execute($request->user(), $session, $requestedTransition);

        return response()->json(['session' => $viewDataFactory->make($updatedSession)]);
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
