<?php

namespace App\Http\Controllers;

use App\Actions\Seasons\ResolveUserSeasonCycle;
use App\Services\Tasks\TaskStatistics;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TaskStatisticsController extends Controller
{
    public function __invoke(Request $request, ResolveUserSeasonCycle $resolveUserSeasonCycle, TaskStatistics $statistics): Response
    {
        $validated = $request->validate([
            'statistics_period' => ['sometimes', 'in:season,month,year,all'],
            'statistics_value' => ['sometimes', 'nullable', 'string', 'max:10', 'regex:/^(?:\d{1,6}|\d{4}(?:-\d{2})?)$/'],
        ]);
        $user = $request->user();
        $cycle = $resolveUserSeasonCycle->execute($user);

        return Inertia::render('tasks/Statistics', [
            'statistics' => fn () => $statistics->summarize(
                $user,
                $cycle,
                $validated['statistics_period'] ?? 'season',
                $validated['statistics_value'] ?? null,
            ),
        ]);
    }
}
