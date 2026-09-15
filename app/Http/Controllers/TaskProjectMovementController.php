<?php

namespace App\Http\Controllers;

use App\Actions\Tasks\MoveTaskProject;
use App\Data\Tasks\MoveTaskProjectData;
use App\Http\Requests\MoveTaskProjectRequest;
use App\Models\TaskProject;
use Illuminate\Http\RedirectResponse;

class TaskProjectMovementController extends Controller
{
    public function __invoke(MoveTaskProjectRequest $request, TaskProject $project, MoveTaskProject $move): RedirectResponse
    {
        $validated = $request->validated();
        $move->execute($request->user(), $project, new MoveTaskProjectData(
            folderId: isset($validated['task_folder_id']) ? (int) $validated['task_folder_id'] : null,
            position: (int) $validated['position'],
        ));

        return back();
    }
}
