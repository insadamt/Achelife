<?php

namespace App\Http\Controllers;

use App\Actions\Seasons\ResolveUserSeasonCycle;
use App\Services\Calendar\UserCalendar;
use App\Support\Seasons\SeasonCycleViewDataFactory;
use App\Support\Seasons\SeasonViewDataFactory;
use App\Support\Today\TodayViewDataFactory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TodayController extends Controller
{
    public function __invoke(
        Request $request,
        TodayViewDataFactory $viewDataFactory,
        ResolveUserSeasonCycle $resolveUserSeasonCycle,
        SeasonCycleViewDataFactory $cycleViewDataFactory,
        SeasonViewDataFactory $seasonViewDataFactory,
        UserCalendar $calendar,
    ): Response {
        $user = $request->user();
        $today = $calendar->today($user);
        $cycle = $resolveUserSeasonCycle->execute($user, $today);

        if ($cycle->activeSeason === null) {
            return Inertia::render('Intermission', [
                'cycle' => $cycleViewDataFactory->make($cycle, $today),
                'lastSeason' => $seasonViewDataFactory->forSeason($cycle->latestSeason->load('objectives'), $today),
            ]);
        }

        return Inertia::render('Home', $viewDataFactory->make($user, $today));
    }
}
