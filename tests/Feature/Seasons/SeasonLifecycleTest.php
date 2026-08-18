<?php

namespace Tests\Feature\Seasons;

use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeasonLifecycleTest extends TestCase
{
    use RefreshDatabase;

    private SynchronizeUserSeasons $synchronizeUserSeasons;

    protected function setUp(): void
    {
        parent::setUp();

        $this->synchronizeUserSeasons = app(SynchronizeUserSeasons::class);
    }

    public function test_day_one_resolves_to_the_first_day_of_season_one(): void
    {
        $user = $this->userCreatedOn('2026-01-01');

        $season = $this->synchronizeUserSeasons->execute($user, CarbonImmutable::parse('2026-01-01'));

        $this->assertSame(1, $season->season_number);
        $this->assertSame('2026-01-01', $season->start_date->toDateString());
        $this->assertSame('2026-01-30', $season->end_date->toDateString());
    }

    public function test_day_thirty_remains_in_the_same_season(): void
    {
        $user = $this->userCreatedOn('2026-01-01');

        $season = $this->synchronizeUserSeasons->execute($user, CarbonImmutable::parse('2026-01-30'));

        $this->assertSame(1, $season->season_number);
        $this->assertDatabaseCount('seasons', 1);
    }

    public function test_day_thirty_one_starts_the_correctly_numbered_next_season(): void
    {
        $user = $this->userCreatedOn('2026-01-01');

        $season = $this->synchronizeUserSeasons->execute($user, CarbonImmutable::parse('2026-01-31'));

        $this->assertSame(2, $season->season_number);
        $this->assertSame('2026-01-31', $season->start_date->toDateString());
        $this->assertSame('2026-03-01', $season->end_date->toDateString());
        $this->assertDatabaseCount('seasons', 2);
    }

    public function test_missing_seasons_are_generated_after_a_long_absence(): void
    {
        $user = $this->userCreatedOn('2026-01-01');

        $currentSeason = $this->synchronizeUserSeasons->execute($user, CarbonImmutable::parse('2026-04-11'));

        $this->assertSame(4, $currentSeason->season_number);
        $this->assertSame([1, 2, 3, 4], $user->seasons()->pluck('season_number')->all());
        $this->assertNotNull($user->seasons()->find(3)?->introduced_at);
        $this->assertNull($currentSeason->introduced_at);
    }

    public function test_repeated_synchronization_does_not_create_duplicates(): void
    {
        $user = $this->userCreatedOn('2026-01-01');
        $today = CarbonImmutable::parse('2026-04-11');

        $this->synchronizeUserSeasons->execute($user, $today);
        $this->synchronizeUserSeasons->execute($user, $today);

        $this->assertDatabaseCount('seasons', 4);
    }

    private function userCreatedOn(string $date): User
    {
        return User::factory()->create([
            'created_at' => CarbonImmutable::parse($date)->startOfDay(),
            'updated_at' => CarbonImmutable::parse($date)->startOfDay(),
        ]);
    }
}
