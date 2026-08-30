<?php

namespace App\Http\Controllers;

use App\Actions\Seasons\ResolveUserSeasonCycle;
use App\Models\Season;
use App\Support\Seasons\SeasonCloseoutViewDataFactory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class SeasonCloseoutController extends Controller
{
    public function show(Season $season, SeasonCloseoutViewDataFactory $viewDataFactory): Response
    {
        Gate::authorize('view', $season);
        abort_if($season->finalized_at === null, 404);

        return Inertia::render('seasons/Closeout', [
            'closeout' => $viewDataFactory->make($season),
        ]);
    }

    public function update(
        Request $request,
        Season $season,
        ResolveUserSeasonCycle $resolveUserSeasonCycle,
    ): RedirectResponse {
        Gate::authorize('view', $season);
        abort_if($season->finalized_at === null, 404);
        $validated = $request->validate([
            'reflection' => ['nullable', 'string', 'max:5000'],
        ]);

        $season->update([
            'reflection' => $validated['reflection'] ?? null,
            'recap_seen_at' => $season->recap_seen_at ?? now(),
        ]);

        $cycle = $resolveUserSeasonCycle->execute($request->user());

        return $cycle->activeSeason === null
            ? redirect()->route('home')
            : redirect()->route('seasons.introduction');
    }
}
