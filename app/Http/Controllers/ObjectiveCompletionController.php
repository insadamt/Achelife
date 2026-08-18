<?php

namespace App\Http\Controllers;

use App\Actions\Objectives\ToggleObjectiveCompletion;
use App\Models\Objective;
use App\Models\Season;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ObjectiveCompletionController extends Controller
{
    public function __invoke(
        Request $request,
        Season $season,
        Objective $objective,
        ToggleObjectiveCompletion $toggleCompletion,
    ): RedirectResponse {
        Gate::authorize('view', $season);
        Gate::authorize('toggle', $objective);
        $toggleCompletion->execute($objective);

        return back();
    }
}
