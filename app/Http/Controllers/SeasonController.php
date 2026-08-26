<?php

namespace App\Http\Controllers;

use App\Actions\Seasons\ResolveUserSeasonCycle;
use App\Enums\SeasonRolloverPreference;
use App\Services\Calendar\UserCalendar;
use App\Support\Seasons\SeasonCycleViewDataFactory;
use App\Support\Seasons\SeasonViewDataFactory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SeasonController extends Controller
{
    public function __invoke(
        Request $request,
        ResolveUserSeasonCycle $resolveUserSeasonCycle,
        SeasonCycleViewDataFactory $cycleViewDataFactory,
        SeasonViewDataFactory $viewDataFactory,
        UserCalendar $calendar,
    ): Response {
        $today = $calendar->today($request->user());
        $user = $request->user();
        $cycle = $resolveUserSeasonCycle->execute($user, $today);
        $realSeasons = $request->user()->seasons()
            ->with(['objectives' => fn ($query) => $query->orderBy('creation_order')])
            ->orderBy('season_number')
            ->get();

        $seasons = $realSeasons->map(fn ($season) => $viewDataFactory->forSeason($season, $today));
        $showExpectedDate = $cycle->activeSeason !== null
            && $user->season_rollover_preference === SeasonRolloverPreference::Automatic
            && ! $user->hold_next_season;
        $nextStart = $showExpectedDate ? $cycle->activeSeason->end_date->addDay() : null;
        $seasons->push($viewDataFactory->placeholder(
            $cycle->latestSeason->season_number + 1,
            $cycle->activeSeason === null || $user->hold_next_season ? 'held' : 'locked',
            $nextStart,
        ));

        if ($cycle->activeSeason !== null) {
            $secondStart = $nextStart?->addDays(30);
            $seasons->push($viewDataFactory->placeholder($cycle->latestSeason->season_number + 2, 'locked', $secondStart));
        }

        return Inertia::render('seasons/Index', [
            'seasons' => $seasons->values(),
            'currentSeasonNumber' => $cycle->activeSeason?->season_number,
            'cycle' => $cycleViewDataFactory->make($cycle, $today),
        ]);
    }
}
