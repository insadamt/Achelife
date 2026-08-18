<?php

namespace App\Http\Controllers;

use App\Actions\Tasks\CompleteTask;
use App\Actions\Tasks\MarkTaskIncomplete;
use App\Models\Task;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class TaskCompletionController extends Controller
{
    public function store(Request $request, Task $task, CompleteTask $completeTask): RedirectResponse
    {
        Gate::authorize('complete', $task);
        $completeTask->execute($request->user(), $task);

        return back();
    }

    public function destroy(Request $request, Task $task, MarkTaskIncomplete $markTaskIncomplete): RedirectResponse
    {
        Gate::authorize('complete', $task);
        $markTaskIncomplete->execute($request->user(), $task);

        return back();
    }
}
