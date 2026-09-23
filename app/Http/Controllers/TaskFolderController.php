<?php

namespace App\Http\Controllers;

use App\Actions\Tasks\ArchiveTaskFolder;
use App\Actions\Tasks\CreateTaskFolder;
use App\Actions\Tasks\DeleteTaskFolder;
use App\Actions\Tasks\ReactivateTaskFolder;
use App\Actions\Tasks\UpdateTaskFolder;
use App\Data\Tasks\TaskFolderData;
use App\Http\Requests\StoreTaskFolderRequest;
use App\Http\Requests\UpdateTaskFolderRequest;
use App\Models\TaskFolder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class TaskFolderController extends Controller
{
    public function store(StoreTaskFolderRequest $request, CreateTaskFolder $create): RedirectResponse
    {
        $create->execute($request->user(), new TaskFolderData(
            name: $request->validated('name'),
            color: $request->validated('color'),
        ));

        return back();
    }

    public function update(UpdateTaskFolderRequest $request, TaskFolder $folder, UpdateTaskFolder $update): RedirectResponse
    {
        $update->execute($request->user(), $folder, new TaskFolderData(
            name: $request->validated('name'),
            color: $request->has('color') ? $request->validated('color') : $folder->color,
        ));

        return back();
    }

    public function destroy(Request $request, TaskFolder $folder, DeleteTaskFolder $delete): RedirectResponse
    {
        Gate::authorize('delete', $folder);
        $delete->execute($request->user(), $folder);

        return back();
    }

    public function archive(Request $request, TaskFolder $folder, ArchiveTaskFolder $archive): RedirectResponse
    {
        Gate::authorize('update', $folder);
        $archive->execute($request->user(), $folder);

        return back();
    }

    public function reactivate(Request $request, TaskFolder $folder, ReactivateTaskFolder $reactivate): RedirectResponse
    {
        Gate::authorize('update', $folder);
        $reactivate->execute($request->user(), $folder);

        return back();
    }
}
