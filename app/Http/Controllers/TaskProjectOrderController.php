<?php

namespace App\Http\Controllers;

use App\Actions\Tasks\ReorderTaskProjects;
use App\Http\Requests\ReorderTaskProjectsRequest;
use Illuminate\Http\RedirectResponse;

class TaskProjectOrderController extends Controller
{
    public function __invoke(ReorderTaskProjectsRequest $request, ReorderTaskProjects $reorder): RedirectResponse
    {
        $validated = $request->validated();
        $reorder->execute(
            $request->user(),
            isset($validated['task_folder_id']) ? (int) $validated['task_folder_id'] : null,
            array_map('intval', $validated['project_ids']),
        );

        return back();
    }
}
