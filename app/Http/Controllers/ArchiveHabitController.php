<?php

namespace App\Http\Controllers;

use App\Actions\Habits\EndHabitLifecycle;
use App\Models\Habit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ArchiveHabitController extends Controller
{
    public function __invoke(Request $request, Habit $habit, EndHabitLifecycle $endHabit): RedirectResponse
    {
        Gate::authorize('archive', $habit);
        $endHabit->archive($request->user(), $habit);

        return back();
    }
}
