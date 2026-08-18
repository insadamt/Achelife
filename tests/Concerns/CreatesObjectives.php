<?php

namespace Tests\Concerns;

use App\Actions\Objectives\CreateObjective;
use App\Actions\Objectives\ToggleObjectiveCompletion;
use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Models\Objective;
use App\Models\Season;
use App\Models\User;
use Carbon\CarbonImmutable;

trait CreatesObjectives
{
    protected function objectiveUserCreatedOn(string $creationDate, string $today): User
    {
        CarbonImmutable::setTestNow("{$today} 10:00:00");
        $user = User::factory()->create([
            'created_at' => CarbonImmutable::parse($creationDate),
            'updated_at' => CarbonImmutable::parse($creationDate),
        ]);
        $this->currentSeasonFor($user, $today)->update(['introduced_at' => now()]);

        return $user;
    }

    protected function currentSeasonFor(User $user, string $today): Season
    {
        return app(SynchronizeUserSeasons::class)->execute($user, CarbonImmutable::parse($today));
    }

    protected function createObjective(
        User $user,
        Season $season,
        string $title = 'Finish portfolio',
        string $today = '2026-08-01',
    ): Objective {
        return app(CreateObjective::class)->execute(
            $user,
            $season,
            $title,
            CarbonImmutable::parse($today),
        );
    }

    protected function toggleObjective(Objective $objective, string $today): Objective
    {
        return app(ToggleObjectiveCompletion::class)->execute(
            $objective,
            CarbonImmutable::parse($today),
        );
    }
}
