<?php

namespace App\Http\Controllers;

use App\Actions\Tasks\CreateTaskFolder;
use App\Actions\Tasks\DeleteTaskFolder;
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
        $create->execute($request->user(), new TaskFolderData($request->validated('name')));

        return back();
    }

    public function update(UpdateTaskFolderRequest $request, TaskFolder $folder, UpdateTaskFolder $update): RedirectResponse
    {
        $update->execute($request->user(), $folder, new TaskFolderData($request->validated('name')));

        return back();
    }

    public function destroy(Request $request, TaskFolder $folder, DeleteTaskFolder $delete): RedirectResponse
    {
        Gate::authorize('delete', $folder);
        $delete->execute($request->user(), $folder);

        return back();
    }
}
