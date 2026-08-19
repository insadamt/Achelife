<?php

namespace App\Http\Controllers;

use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Services\Calendar\UserCalendar;
use App\Support\Seasons\SeasonViewDataFactory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SeasonController extends Controller
{
    public function __invoke(
        Request $request,
        SynchronizeUserSeasons $synchronizeUserSeasons,
        SeasonViewDataFactory $viewDataFactory,
        UserCalendar $calendar,
    ): Response {
        $today = $calendar->today($request->user());
        $currentSeason = $synchronizeUserSeasons->execute($request->user(), $today);
        $realSeasons = $request->user()->seasons()
            ->with(['objectives' => fn ($query) => $query->orderBy('creation_order')])
            ->orderBy('season_number')
            ->get();

        $seasons = $realSeasons
            ->map(fn ($season) => $viewDataFactory->forSeason($season, $today))
            ->push($viewDataFactory->lockedPlaceholder($currentSeason, 1))
            ->push($viewDataFactory->lockedPlaceholder($currentSeason, 2))
            ->values();

        return Inertia::render('seasons/Index', [
            'seasons' => $seasons,
            'currentSeasonNumber' => $currentSeason->season_number,
        ]);
    }
}
