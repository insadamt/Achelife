<?php

namespace App\Http\Controllers;

use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Models\Season;
use App\Services\Calendar\UserCalendar;
use App\Support\Seasons\SeasonViewDataFactory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class SeasonIntroductionController extends Controller
{
    public function show(
        Request $request,
        SynchronizeUserSeasons $synchronizeUserSeasons,
        SeasonViewDataFactory $viewDataFactory,
        UserCalendar $calendar,
    ): Response|RedirectResponse {
        $today = $calendar->today($request->user());
        $currentSeason = $synchronizeUserSeasons->execute($request->user(), $today);
        $pendingCloseout = $this->pendingCloseout($request, $currentSeason);

        if ($pendingCloseout !== null) {
            return redirect()->route('seasons.closeout', $pendingCloseout);
        }

        if ($currentSeason->introduced_at !== null) {
            return redirect()->to($this->consumeRedirectDestination($request));
        }

        $previousSeason = $request->user()->seasons()
            ->where('season_number', $currentSeason->season_number - 1)
            ->first();

        return Inertia::render('seasons/Introduction', [
            'season' => $viewDataFactory->forSeason($currentSeason, $today),
            'previousSeason' => $previousSeason === null ? null : $viewDataFactory->forSeason($previousSeason, $today),
        ]);
    }

    public function acknowledge(
        Request $request,
        Season $season,
        SynchronizeUserSeasons $synchronizeUserSeasons,
    ): RedirectResponse {
        Gate::authorize('acknowledgeIntroduction', $season);

        $currentSeason = $synchronizeUserSeasons->execute($request->user());
        abort_unless($season->is($currentSeason), 404);
        $pendingCloseout = $this->pendingCloseout($request, $currentSeason);

        if ($pendingCloseout !== null) {
            return redirect()->route('seasons.closeout', $pendingCloseout);
        }

        if ($season->introduced_at === null) {
            $season->update(['introduced_at' => now()]);
        }

        return redirect()->to($this->consumeRedirectDestination($request));
    }

    private function consumeRedirectDestination(Request $request): string
    {
        return $request->session()->pull('season_introduction_redirect', route('seasons.index', absolute: false));
    }

    private function pendingCloseout(Request $request, Season $currentSeason): ?Season
    {
        return $request->user()->seasons()
            ->where('season_number', $currentSeason->season_number - 1)
            ->whereNotNull('finalized_at')
            ->whereNull('recap_seen_at')
            ->first();
    }
}
