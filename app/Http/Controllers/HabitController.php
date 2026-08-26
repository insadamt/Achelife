<?php

namespace App\Http\Controllers;

use App\Actions\Habits\CreateHabit;
use App\Actions\Habits\EndHabitLifecycle;
use App\Actions\Habits\SynchronizeHabitOccurrences;
use App\Actions\Habits\UpdateHabitDefinition;
use App\Data\Habits\HabitData;
use App\Enums\HabitCalendarLabels;
use App\Http\Requests\StoreHabitRequest;
use App\Http\Requests\UpdateHabitRequest;
use App\Models\Habit;
use App\Models\HabitSetting;
use App\Services\Calendar\UserCalendar;
use App\Support\Habits\HabitViewDataFactory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class HabitController extends Controller
{
    public function index(
        Request $request,
        SynchronizeHabitOccurrences $synchronizeOccurrences,
        HabitViewDataFactory $viewDataFactory,
        UserCalendar $calendar,
    ): Response {
        $today = $calendar->today($request->user());
        $currentSeason = $synchronizeOccurrences->execute($request->user(), $today);
        $displaySeason = $currentSeason ?? $request->user()->seasons()->latest('season_number')->firstOrFail();
        $settings = HabitSetting::query()->firstOrCreate(
            ['user_id' => $request->user()->id],
            ['calendar_labels' => HabitCalendarLabels::CalendarDates],
        );
        $habits = $request->user()->habits()
            ->whereNull('archived_at')
            ->with(['definitionVersions', 'occurrences' => fn ($query) => $query->where('season_id', $displaySeason->id)])
            ->orderBy('created_at')
            ->get()
            ->map(fn (Habit $habit) => $viewDataFactory->make($habit, $displaySeason, $today));

        return Inertia::render('habits/Index', [
            'today' => $today->toDateString(),
            'currentWeek' => [
                'startDate' => $today->startOfWeek()->toDateString(),
                'endDate' => $today->endOfWeek()->toDateString(),
            ],
            'calendarLabels' => $settings->calendar_labels->value,
            'currentSeason' => [
                'id' => $displaySeason->id,
                'number' => $displaySeason->season_number,
                'startDate' => $displaySeason->start_date->toDateString(),
                'endDate' => $displaySeason->end_date->toDateString(),
                'seasonPoints' => $displaySeason->season_points,
            ],
            'habits' => $habits,
            'intermission' => $currentSeason === null,
        ]);
    }

    public function archived(Request $request, HabitViewDataFactory $viewDataFactory): Response
    {
        $habits = $request->user()->habits()
            ->whereNotNull('archived_at')
            ->with('definitionVersions')
            ->latest('archived_at')
            ->get()
            ->map(fn (Habit $habit) => $viewDataFactory->makeArchived($habit));

        return Inertia::render('habits/Archived', ['habits' => $habits]);
    }

    public function store(StoreHabitRequest $request, CreateHabit $createHabit): RedirectResponse
    {
        $createHabit->execute($request->user(), HabitData::fromValidated($request->validated()));

        return back();
    }

    public function update(UpdateHabitRequest $request, Habit $habit, UpdateHabitDefinition $updateHabit): RedirectResponse
    {
        $updateHabit->execute($habit, HabitData::fromValidated($request->validated()));

        return back();
    }

    public function destroy(Request $request, Habit $habit, EndHabitLifecycle $endHabit): RedirectResponse
    {
        Gate::authorize('delete', $habit);
        $endHabit->delete($request->user(), $habit);

        return back();
    }
}
