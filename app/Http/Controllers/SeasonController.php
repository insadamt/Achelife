<?php

namespace App\Http\Controllers;

use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Support\Seasons\SeasonViewDataFactory;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SeasonController extends Controller
{
    public function __invoke(
        Request $request,
        SynchronizeUserSeasons $synchronizeUserSeasons,
        SeasonViewDataFactory $viewDataFactory,
    ): Response {
        $today = CarbonImmutable::today();
        $currentSeason = $synchronizeUserSeasons->execute($request->user(), $today);
        $realSeasons = $request->user()->seasons()->orderBy('season_number')->get();

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
