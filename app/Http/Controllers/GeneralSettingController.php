<?php

namespace App\Http\Controllers;

use App\Actions\Seasons\ResolveUserSeasonCycle;
use App\Actions\Seasons\StartNextSeason;
use App\Enums\SeasonRolloverPreference;
use App\Http\Requests\UpdateGeneralSettingRequest;
use App\Services\Calendar\UserCalendar;
use App\Support\Settings\TimezoneCatalog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GeneralSettingController extends Controller
{
    public function index(Request $request, TimezoneCatalog $timezoneCatalog, UserCalendar $calendar): Response
    {
        $user = $request->user();

        return Inertia::render('settings/General', [
            'restorePreview' => $request->session()->get('portability.pending.account.preview'),
            'settings' => [
                'timezone' => $user->timezone,
                'today' => $calendar->today($user)->toDateString(),
                'seasonRolloverPreference' => ($user->season_rollover_preference ?? SeasonRolloverPreference::Automatic)->value,
            ],
            'timezones' => $timezoneCatalog->all(),
        ]);
    }

    public function update(
        UpdateGeneralSettingRequest $request,
        ResolveUserSeasonCycle $resolveUserSeasonCycle,
        StartNextSeason $startNextSeason,
        UserCalendar $calendar,
    ): RedirectResponse {
        $user = $request->user();
        $cycleBeforeUpdate = $resolveUserSeasonCycle->execute($user, $calendar->today($user));
        $previousRolloverPreference = $user->season_rollover_preference ?? SeasonRolloverPreference::Automatic;
        $rolloverPreference = SeasonRolloverPreference::from(
            $request->validated('season_rollover_preference', $previousRolloverPreference->value),
        );

        $user->update([
            'timezone' => $request->validated('timezone'),
            'season_rollover_preference' => $rolloverPreference,
        ]);

        if (
            $cycleBeforeUpdate->activeSeason === null
            && $previousRolloverPreference === SeasonRolloverPreference::Manual
            && $rolloverPreference === SeasonRolloverPreference::Automatic
        ) {
            $startNextSeason->execute($user->refresh());
        }

        return back();
    }
}
