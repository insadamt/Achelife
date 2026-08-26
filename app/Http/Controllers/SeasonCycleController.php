<?php

namespace App\Http\Controllers;

use App\Actions\Seasons\ResolveUserSeasonCycle;
use App\Actions\Seasons\StartNextSeason;
use App\Enums\SeasonRolloverPreference;
use App\Services\Calendar\UserCalendar;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class SeasonCycleController extends Controller
{
    public function start(Request $request, StartNextSeason $startNextSeason): RedirectResponse
    {
        $startNextSeason->execute($request->user());

        return redirect()->route('seasons.introduction');
    }

    public function hold(Request $request, ResolveUserSeasonCycle $resolveUserSeasonCycle, UserCalendar $calendar): RedirectResponse
    {
        $attributes = $request->validate(['hold' => ['required', 'boolean']]);
        $user = $request->user();
        $cycle = $resolveUserSeasonCycle->execute($user, $calendar->today($user));

        if ($cycle->activeSeason === null) {
            throw ValidationException::withMessages(['season' => 'The next-Season hold can only be changed during an active Season.']);
        }

        if ($user->season_rollover_preference !== SeasonRolloverPreference::Automatic) {
            throw ValidationException::withMessages(['season' => 'Manual rollover already waits for you after Day 30.']);
        }

        $user->update(['hold_next_season' => $attributes['hold']]);

        return back();
    }
}
