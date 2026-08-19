<?php

namespace App\Http\Controllers;

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
            'settings' => [
                'timezone' => $user->timezone,
                'today' => $calendar->today($user)->toDateString(),
            ],
            'timezones' => $timezoneCatalog->all(),
        ]);
    }

    public function update(UpdateGeneralSettingRequest $request): RedirectResponse
    {
        $request->user()->update(['timezone' => $request->validated('timezone')]);

        return back();
    }
}
