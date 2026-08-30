<?php

namespace App\Actions\Onboarding;

use App\Actions\Habits\CreateHabit;
use App\Actions\Money\CreateMoneyAccount;
use App\Actions\Money\InstallMoneyPresetPack;
use App\Actions\Objectives\CreateObjective;
use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Actions\Tasks\CreateTask;
use App\Data\Habits\HabitData;
use App\Data\Tasks\TaskData;
use App\Enums\SeasonRolloverPreference;
use App\Models\User;
use App\Services\Calendar\UserCalendar;
use App\Support\Money\MoneyAmount;
use Illuminate\Support\Facades\DB;

class AdvanceFreshOnboarding
{
    public function __construct(
        private readonly SynchronizeUserSeasons $synchronizeSeasons,
        private readonly CreateObjective $createObjective,
        private readonly CreateHabit $createHabit,
        private readonly CreateTask $createTask,
        private readonly InstallMoneyPresetPack $installMoneyPresetPack,
        private readonly CreateMoneyAccount $createMoneyAccount,
        private readonly MoneyAmount $moneyAmount,
        private readonly UserCalendar $userCalendar,
    ) {}

    public function chooseFreshStart(User $user): void
    {
        $this->advance($user, 'path', 'profile');
    }

    /** @param array{name: string, timezone: string, season_rollover_preference: string} $profile */
    public function confirmProfile(User $user, array $profile): void
    {
        $this->withCurrentStep($user, 'profile', function (User $lockedUser) use ($profile): void {
            $lockedUser->update([
                'name' => $profile['name'],
                'timezone' => $profile['timezone'],
                'season_rollover_preference' => SeasonRolloverPreference::from($profile['season_rollover_preference']),
            ]);
            $lockedUser->update(['calendar_started_on' => $this->userCalendar->today($lockedUser)->toDateString()]);
            $this->synchronizeSeasons->execute($lockedUser->refresh());
            $lockedUser->update(['onboarding_step' => 'objectives']);
        });
    }

    /** @param list<string> $titles */
    public function saveObjectives(User $user, array $titles): void
    {
        $this->withCurrentStep($user, 'objectives', function (User $lockedUser) use ($titles): void {
            $season = $this->synchronizeSeasons->execute($lockedUser);

            foreach ($titles as $title) {
                $this->createObjective->execute($lockedUser, $season, $title);
            }

            $lockedUser->update(['onboarding_step' => 'habit']);
        });
    }

    public function saveHabit(User $user, ?HabitData $habit): void
    {
        $this->withCurrentStep($user, 'habit', function (User $lockedUser) use ($habit): void {
            if ($habit !== null) {
                $this->createHabit->execute($lockedUser, $habit);
            }

            $lockedUser->update(['onboarding_step' => 'task']);
        });
    }

    public function saveTask(User $user, ?TaskData $task): void
    {
        $this->withCurrentStep($user, 'task', function (User $lockedUser) use ($task): void {
            if ($task !== null) {
                $this->createTask->execute($lockedUser, $task);
            }

            $lockedUser->update(['onboarding_step' => 'money']);
        });
    }

    public function finishMoney(User $user, bool $installPresetPack, ?string $accountName, ?string $currency, ?string $initialBalance): void
    {
        $this->withCurrentStep($user, 'money', function (User $lockedUser) use ($installPresetPack, $accountName, $currency, $initialBalance): void {
            if ($installPresetPack) {
                $this->installMoneyPresetPack->execute($lockedUser);
            }

            if ($accountName !== null && $currency !== null && $initialBalance !== null) {
                $this->createMoneyAccount->execute(
                    $lockedUser,
                    $accountName,
                    $currency,
                    $this->moneyAmount->toMinorUnits($initialBalance, true),
                );
            }

            $lockedUser->update([
                'onboarding_step' => 'complete',
                'onboarding_completed_at' => now(),
            ]);
        });
    }

    private function advance(User $user, string $currentStep, string $nextStep): void
    {
        $this->withCurrentStep($user, $currentStep, fn (User $lockedUser) => $lockedUser->update(['onboarding_step' => $nextStep]));
    }

    private function withCurrentStep(User $user, string $expectedStep, callable $operation): void
    {
        DB::transaction(function () use ($user, $expectedStep, $operation): void {
            $lockedUser = User::query()->lockForUpdate()->findOrFail($user->id);

            if ($lockedUser->onboarding_completed_at !== null || $lockedUser->onboarding_step !== $expectedStep) {
                return;
            }

            $operation($lockedUser);
        }, 3);
    }
}
