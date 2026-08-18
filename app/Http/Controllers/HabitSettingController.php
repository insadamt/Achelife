<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateHabitSettingRequest;
use App\Models\HabitSetting;
use Illuminate\Http\RedirectResponse;

class HabitSettingController extends Controller
{
    public function update(UpdateHabitSettingRequest $request): RedirectResponse
    {
        HabitSetting::query()->updateOrCreate(
            ['user_id' => $request->user()->id],
            ['calendar_labels' => $request->validated('calendar_labels')],
        );

        return back();
    }
}
