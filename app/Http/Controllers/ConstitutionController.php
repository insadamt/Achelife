<?php

namespace App\Http\Controllers;

use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Models\Law;
use App\Services\Calendar\UserCalendar;
use App\Support\Constitution\ConstitutionViewDataFactory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ConstitutionController extends Controller
{
    public function index(
        Request $request,
        SynchronizeUserSeasons $synchronizeUserSeasons,
        ConstitutionViewDataFactory $viewDataFactory,
        UserCalendar $calendar,
    ): Response {
        $today = $calendar->today($request->user());
        $currentSeason = $synchronizeUserSeasons->execute($request->user(), $today);
        $laws = $request->user()->laws()
            ->whereNull('archived_at')
            ->withCount('violations')
            ->with(['violations' => fn ($query) => $query
                ->where('season_id', $currentSeason->id)
                ->orderBy('violation_date')
                ->orderBy('created_at')
                ->orderBy('id')])
            ->orderBy('created_at')
            ->orderBy('id')
            ->get()
            ->map(fn (Law $law) => $viewDataFactory->makeActiveLaw($law));
        $currentSeasonViolations = $request->user()->violations()
            ->where('season_id', $currentSeason->id)
            ->get(['penalty_sp']);

        return Inertia::render('constitution/Index', [
            'today' => $today->toDateString(),
            'currentSeason' => [
                'id' => $currentSeason->id,
                'number' => $currentSeason->season_number,
                'startDate' => $currentSeason->start_date->toDateString(),
                'endDate' => $currentSeason->end_date->toDateString(),
                'seasonPoints' => $currentSeason->season_points,
            ],
            'summary' => [
                'violationCount' => $currentSeasonViolations->count(),
                'spLost' => abs($currentSeasonViolations->sum('penalty_sp')),
            ],
            'laws' => $laws,
        ]);
    }

    public function archived(Request $request, ConstitutionViewDataFactory $viewDataFactory): Response
    {
        $laws = $request->user()->laws()
            ->whereNotNull('archived_at')
            ->withCount('violations')
            ->latest('archived_at')
            ->get()
            ->map(fn (Law $law) => $viewDataFactory->makeArchivedLaw($law));

        return Inertia::render('constitution/Archived', ['laws' => $laws]);
    }
}
