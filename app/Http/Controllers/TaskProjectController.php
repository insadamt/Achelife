<?php

namespace App\Http\Controllers;

use App\Actions\Tasks\ArchiveTaskProject;
use App\Actions\Tasks\CreateTaskProject;
use App\Actions\Tasks\DeleteTaskProject;
use App\Actions\Tasks\ReactivateTaskProject;
use App\Actions\Tasks\UpdateTaskProject;
use App\Data\Tasks\TaskProjectData;
use App\Http\Requests\StoreTaskProjectRequest;
use App\Http\Requests\UpdateTaskProjectRequest;
use App\Models\TaskProject;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class TaskProjectController extends Controller
{
    public function store(StoreTaskProjectRequest $request, CreateTaskProject $create): RedirectResponse
    {
        $create->execute($request->user(), $this->data($request->validated()));

        return back();
    }

    public function update(UpdateTaskProjectRequest $request, TaskProject $project, UpdateTaskProject $update): RedirectResponse
    {
        $update->execute($request->user(), $project, new TaskProjectData(
            name: $request->validated('name'),
            folderId: $project->task_folder_id,
            color: $request->has('color') ? $request->validated('color') : $project->color,
        ));

        return back();
    }

    public function destroy(Request $request, TaskProject $project, DeleteTaskProject $delete): RedirectResponse
    {
        Gate::authorize('delete', $project);
        $delete->execute($request->user(), $project);

        return back();
    }

    /** @param array<string, mixed> $validated */
    private function data(array $validated): TaskProjectData
    {
        return new TaskProjectData(
            name: $validated['name'],
            folderId: isset($validated['task_folder_id']) ? (int) $validated['task_folder_id'] : null,
            color: $validated['color'] ?? null,
        );
    }

    public function archive(Request $request, TaskProject $project, ArchiveTaskProject $archive): RedirectResponse
    {
        Gate::authorize('update', $project);
        $archive->execute($request->user(), $project);

        return back();
    }

    public function reactivate(Request $request, TaskProject $project, ReactivateTaskProject $reactivate): RedirectResponse
    {
        Gate::authorize('update', $project);
        $reactivate->execute($request->user(), $project);

        return back();
    }
}
