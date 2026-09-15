<?php

namespace App\Http\Controllers;

use App\Actions\Tasks\ReorderTasks;
use App\Http\Requests\ReorderTasksRequest;
use Illuminate\Http\RedirectResponse;

class TaskOrderController extends Controller
{
    public function __invoke(ReorderTasksRequest $request, ReorderTasks $reorder): RedirectResponse
    {
        $validated = $request->validated();
        $reorder->execute(
            $request->user(),
            isset($validated['task_project_id']) ? (int) $validated['task_project_id'] : null,
            array_map('intval', $validated['task_ids']),
        );

        return back();
    }
}
