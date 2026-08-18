<?php

namespace App\Http\Controllers;

use App\Actions\Tasks\SetSubtaskCompletion;
use App\Models\Subtask;
use App\Models\Task;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class SubtaskCompletionController extends Controller
{
    public function update(
        Request $request,
        Task $task,
        Subtask $subtask,
        SetSubtaskCompletion $setSubtaskCompletion,
    ): RedirectResponse {
        Gate::authorize('update', $task);
        $validated = $request->validate(['completed' => ['required', 'boolean']]);
        $setSubtaskCompletion->execute($task, $subtask, $validated['completed']);

        return back();
    }
}
