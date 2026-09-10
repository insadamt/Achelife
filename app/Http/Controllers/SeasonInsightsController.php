<?php

namespace App\Http\Controllers;

use App\Models\Season;
use App\Services\Calendar\UserCalendar;
use App\Support\Seasons\SeasonInsightsViewDataFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class SeasonInsightsController extends Controller
{
    public function __invoke(
        Request $request,
        Season $season,
        SeasonInsightsViewDataFactory $viewDataFactory,
        UserCalendar $calendar,
    ): JsonResponse {
        Gate::authorize('view', $season);

        return response()->json($viewDataFactory->make($season, $calendar->today($request->user())));
    }
}
