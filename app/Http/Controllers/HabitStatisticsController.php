<?php

namespace App\Http\Controllers;

use App\Actions\Habits\SynchronizeHabitOccurrences;
use App\Actions\Seasons\ResolveUserSeasonCycle;
use App\Models\Habit;
use App\Services\Habits\HabitStatistics;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class HabitStatisticsController extends Controller
{
    public function __invoke(Request $request, Habit $habit, SynchronizeHabitOccurrences $synchronize, ResolveUserSeasonCycle $resolveCycle, HabitStatistics $statistics): Response
    {
        Gate::authorize('view', $habit);
        $validated = $request->validate([
            'statistics_period' => ['sometimes', 'in:season,month,year,all'],
            'statistics_value' => ['sometimes', 'nullable', 'string', 'max:10', 'regex:/^(?:\d{1,6}|\d{4}(?:-\d{2})?)$/'],
        ]);
        $user = $request->user();
        $synchronize->execute($user);
        $habit->refresh();
        $cycle = $resolveCycle->execute($user);

        return Inertia::render('habits/Statistics', [
            'habit' => ['id' => $habit->id, 'name' => $habit->name, 'type' => $habit->type->value, 'unit' => $habit->unit, 'archived' => $habit->archived_at !== null],
            'statistics' => fn () => $statistics->summarize($user, $habit, $cycle, $validated['statistics_period'] ?? 'season', $validated['statistics_value'] ?? null),
        ]);
    }
}
