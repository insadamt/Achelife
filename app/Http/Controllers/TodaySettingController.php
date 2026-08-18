<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateTodaySettingRequest;
use App\Models\TodaySetting;
use Illuminate\Http\RedirectResponse;

class TodaySettingController extends Controller
{
    public function update(UpdateTodaySettingRequest $request): RedirectResponse
    {
        TodaySetting::query()->updateOrCreate(
            ['user_id' => $request->user()->id],
            $request->validated(),
        );

        return back();
    }
}
