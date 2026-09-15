<?php

namespace App\Http\Controllers;

use App\Actions\Tasks\MoveTask;
use App\Data\Tasks\MoveTaskData;
use App\Http\Requests\MoveTaskRequest;
use App\Models\Task;
use Illuminate\Http\RedirectResponse;

class TaskMovementController extends Controller
{
    public function __invoke(MoveTaskRequest $request, Task $task, MoveTask $move): RedirectResponse
    {
        $validated = $request->validated();
        $move->execute($request->user(), $task, new MoveTaskData(
            projectId: isset($validated['task_project_id']) ? (int) $validated['task_project_id'] : null,
            position: (int) $validated['position'],
        ));

        return back();
    }
}
