<?php

namespace App\Http\Controllers;

use App\Actions\Onboarding\AdvanceFreshOnboarding;
use App\Data\Habits\HabitData;
use App\Data\Tasks\TaskData;
use App\Enums\HabitDifficulty;
use App\Enums\HabitScheduleType;
use App\Enums\HabitType;
use App\Enums\SeasonRolloverPreference;
use App\Services\Calendar\UserCalendar;
use App\Support\Settings\TimezoneCatalog;
use DateTimeZone;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function show(Request $request, TimezoneCatalog $timezoneCatalog, UserCalendar $calendar): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user->onboarding_completed_at !== null) {
            return redirect()->route('home');
        }

        return Inertia::render('onboarding/Index', [
            'step' => $user->onboarding_step,
            'restorePreview' => $request->session()->get('portability.pending.fresh.preview'),
            'profile' => [
                'name' => $user->name,
                'timezone' => $user->timezone,
                'today' => $calendar->today($user)->toDateString(),
                'seasonRolloverPreference' => ($user->season_rollover_preference ?? SeasonRolloverPreference::Automatic)->value,
            ],
            'timezones' => $timezoneCatalog->all(),
        ]);
    }

    public function update(Request $request, string $step, AdvanceFreshOnboarding $onboarding, UserCalendar $calendar): RedirectResponse
    {
        match ($step) {
            'path' => $this->choosePath($request, $onboarding),
            'profile' => $this->confirmProfile($request, $onboarding),
            'objectives' => $this->saveObjectives($request, $onboarding),
            'habit' => $this->saveHabit($request, $onboarding),
            'task' => $this->saveTask($request, $onboarding, $calendar),
            'money' => $this->finishMoney($request, $onboarding),
            default => abort(404),
        };

        return $request->user()->refresh()->onboarding_completed_at === null
            ? redirect()->route('onboarding.show')
            : redirect()->route('seasons.introduction');
    }

    private function choosePath(Request $request, AdvanceFreshOnboarding $onboarding): void
    {
        $request->validate(['path' => ['required', Rule::in(['fresh'])]]);
        $onboarding->chooseFreshStart($request->user());
    }

    private function confirmProfile(Request $request, AdvanceFreshOnboarding $onboarding): void
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'timezone' => ['required', 'string', 'max:64', Rule::in([...DateTimeZone::listIdentifiers(), 'UTC'])],
            'season_rollover_preference' => ['required', Rule::enum(SeasonRolloverPreference::class)],
        ]);
        $onboarding->confirmProfile($request->user(), $validated);
    }

    private function saveObjectives(Request $request, AdvanceFreshOnboarding $onboarding): void
    {
        $validated = $request->validate([
            'titles' => ['present', 'array', 'max:3'],
            'titles.*' => ['required', 'string', 'max:255', 'distinct'],
        ], [
            'titles.*.distinct' => 'Objective titles must be unique.',
        ]);
        $onboarding->saveObjectives($request->user(), array_values($validated['titles']));
    }

    private function saveHabit(Request $request, AdvanceFreshOnboarding $onboarding): void
    {
        $validated = $request->validate([
            'skip' => ['required', 'boolean'],
            'name' => ['exclude_if:skip,true', 'required_if:skip,false', 'string', 'max:255'],
        ]);
        $habit = $validated['skip'] ? null : HabitData::fromValidated([
            'name' => $validated['name'],
            'type' => HabitType::Boolean->value,
            'difficulty' => HabitDifficulty::Normal->value,
            'schedule_type' => HabitScheduleType::EveryDay->value,
        ]);
        $onboarding->saveHabit($request->user(), $habit);
    }

    private function saveTask(Request $request, AdvanceFreshOnboarding $onboarding, UserCalendar $calendar): void
    {
        $validated = $request->validate([
            'skip' => ['required', 'boolean'],
            'title' => ['exclude_if:skip,true', 'required_if:skip,false', 'string', 'max:255'],
        ]);
        $task = $validated['skip'] ? null : TaskData::fromValidated([
            'title' => $validated['title'],
            'scheduled_date' => $calendar->today($request->user())->toDateString(),
        ]);
        $onboarding->saveTask($request->user(), $task);
    }

    private function finishMoney(Request $request, AdvanceFreshOnboarding $onboarding): void
    {
        $validated = $request->validate([
            'install_preset_pack' => ['required', 'boolean'],
            'create_account' => ['required', 'boolean'],
            'account_name' => ['exclude_if:create_account,false', 'required_if:create_account,true', 'string', 'max:120'],
            'currency' => ['exclude_if:create_account,false', 'required_if:create_account,true', 'string', 'size:3', 'regex:/^[A-Za-z]{3}$/'],
            'initial_balance' => ['exclude_if:create_account,false', 'required_if:create_account,true', 'string', 'regex:/^-?\d{1,12}(?:\.\d{1,2})?$/'],
        ]);
        $onboarding->finishMoney(
            $request->user(),
            $validated['install_preset_pack'],
            $validated['create_account'] ? $validated['account_name'] : null,
            $validated['create_account'] ? $validated['currency'] : null,
            $validated['create_account'] ? $validated['initial_balance'] : null,
        );
    }
}
