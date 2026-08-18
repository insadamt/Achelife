<?php

namespace App\Http\Controllers;

use App\Actions\Habits\UpdateHabitOccurrence;
use App\Http\Requests\StoreNumericHabitValueRequest;
use App\Models\Habit;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class HabitOccurrenceController extends Controller
{
    public function toggle(Request $request, Habit $habit, string $date, UpdateHabitOccurrence $updateOccurrence): RedirectResponse
    {
        Gate::authorize('update', $habit);
        $updateOccurrence->toggleBoolean($request->user(), $habit, $this->calendarDate($date));

        return back();
    }

    public function numeric(
        StoreNumericHabitValueRequest $request,
        Habit $habit,
        string $date,
        UpdateHabitOccurrence $updateOccurrence,
    ): RedirectResponse {
        $value = $request->validated('value');
        $updateOccurrence->saveNumericValue(
            $request->user(),
            $habit,
            $this->calendarDate($date),
            $value === null ? null : (string) $value,
        );

        return back();
    }

    public function skip(Request $request, Habit $habit, string $date, UpdateHabitOccurrence $updateOccurrence): RedirectResponse
    {
        Gate::authorize('update', $habit);
        $updateOccurrence->skip($request->user(), $habit, $this->calendarDate($date));

        return back();
    }

    public function clear(Request $request, Habit $habit, string $date, UpdateHabitOccurrence $updateOccurrence): RedirectResponse
    {
        Gate::authorize('update', $habit);
        $updateOccurrence->clear($request->user(), $habit, $this->calendarDate($date));

        return back();
    }

    private function calendarDate(string $date): CarbonImmutable
    {
        return CarbonImmutable::createFromFormat('!Y-m-d', $date);
    }
}
