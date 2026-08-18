<?php

namespace App\Http\Controllers;

use App\Actions\Tasks\StopTaskSeriesFromOccurrence;
use App\Models\Task;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class StopTaskSeriesController extends Controller
{
    public function __invoke(Task $task, StopTaskSeriesFromOccurrence $stopTaskSeries): RedirectResponse
    {
        Gate::authorize('delete', $task);
        $stopTaskSeries->execute($task);

        return back();
    }
}
