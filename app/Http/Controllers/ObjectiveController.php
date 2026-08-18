<?php

namespace App\Http\Controllers;

use App\Actions\Objectives\CreateObjective;
use App\Actions\Objectives\DeleteObjective;
use App\Actions\Objectives\RenameObjective;
use App\Http\Requests\StoreObjectiveRequest;
use App\Http\Requests\UpdateObjectiveRequest;
use App\Models\Objective;
use App\Models\Season;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ObjectiveController extends Controller
{
    public function store(StoreObjectiveRequest $request, Season $season, CreateObjective $createObjective): RedirectResponse
    {
        $createObjective->execute($request->user(), $season, $request->validated('title'));

        return back();
    }

    public function update(
        UpdateObjectiveRequest $request,
        Season $season,
        Objective $objective,
        RenameObjective $renameObjective,
    ): RedirectResponse {
        Gate::authorize('view', $season);
        $renameObjective->execute($objective, $request->validated('title'));

        return back();
    }

    public function destroy(
        Request $request,
        Season $season,
        Objective $objective,
        DeleteObjective $deleteObjective,
    ): RedirectResponse {
        Gate::authorize('view', $season);
        Gate::authorize('delete', $objective);
        $deleteObjective->execute($objective);

        return back();
    }
}
