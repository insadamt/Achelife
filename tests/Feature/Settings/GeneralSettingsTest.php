<?php

namespace Tests\Feature\Settings;

use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Actions\Tasks\CompleteTask;
use App\Models\User;
use App\Services\Calendar\UserCalendar;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class GeneralSettingsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-08-19 23:30:00', 'UTC'));
    }

    public function test_user_calendar_resolves_today_in_the_saved_timezone(): void
    {
        $ahead = User::factory()->create(['timezone' => 'Asia/Dubai']);
        $behind = User::factory()->create(['timezone' => 'America/Los_Angeles']);
        $calendar = app(UserCalendar::class);

        $this->assertSame('2026-08-20', $calendar->today($ahead)->toDateString());
        $this->assertSame('2026-08-19', $calendar->today($behind)->toDateString());
    }

    public function test_general_settings_page_exposes_the_saved_and_detectable_timezones(): void
    {
        $user = $this->introducedUser('Asia/Dubai');

        $this->actingAs($user)->get('/settings/general')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('settings/General')
            ->where('settings.timezone', 'Asia/Dubai')
            ->where('settings.today', '2026-08-20')
            ->where('auth.user.timezone', 'Asia/Dubai')
            ->has('timezones')
            ->where('timezones.0.value', 'UTC')
            ->has('timezones.0.label'));
    }

    public function test_user_can_update_timezone_without_rewriting_the_calendar_timeline(): void
    {
        $user = $this->introducedUser('UTC');
        $originalStart = $user->calendar_started_on->toDateString();
        $seasonDates = $user->seasons()->orderBy('season_number')->get()->mapWithKeys(
            fn ($season) => [$season->season_number => $season->start_date->toDateString()],
        )->all();

        $this->actingAs($user)
            ->put('/settings/general', ['timezone' => 'Pacific/Auckland'])
            ->assertRedirect();

        $user->refresh();
        $this->assertSame('Pacific/Auckland', $user->timezone);
        $this->assertSame($originalStart, $user->calendar_started_on->toDateString());
        $updatedSeasonDates = $user->seasons()->orderBy('season_number')->get()->mapWithKeys(
            fn ($season) => [$season->season_number => $season->start_date->toDateString()],
        )->all();
        $this->assertSame($seasonDates, $updatedSeasonDates);
    }

    public function test_timezone_update_rejects_unknown_identifiers(): void
    {
        $user = User::factory()->create(['timezone' => 'UTC']);

        $this->actingAs($user)
            ->from('/settings/general')
            ->put('/settings/general', ['timezone' => 'UTC+02'])
            ->assertRedirect('/settings/general')
            ->assertSessionHasErrors('timezone');

        $this->assertSame('UTC', $user->refresh()->timezone);
    }

    public function test_today_page_uses_the_users_local_calendar_date(): void
    {
        $user = $this->introducedUser('Asia/Dubai');

        $this->actingAs($user)->get('/home')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Home')
            ->where('today', '2026-08-20')
            ->where('currentSeason.day', 20));
    }

    public function test_task_completion_uses_local_date_but_keeps_the_utc_timestamp(): void
    {
        $user = User::factory()->create([
            'timezone' => 'Asia/Dubai',
            'calendar_started_on' => '2026-08-01',
        ]);
        $task = $user->tasks()->create([
            'title' => 'Finish after UTC midnight boundary',
            'scheduled_date' => '2026-08-20',
            'important' => true,
        ]);

        app(CompleteTask::class)->execute($user, $task);

        $task->refresh();
        $this->assertSame('on_time', $task->completion_timing->value);
        $this->assertSame('2026-08-19 23:30:00', $task->completed_at->utc()->format('Y-m-d H:i:s'));
        $this->assertSame(1, $task->rewardSeason->season_number);
        $this->assertSame(8, $task->earned_sp);
    }

    private function introducedUser(string $timezone): User
    {
        $user = User::factory()->create([
            'timezone' => $timezone,
            'calendar_started_on' => '2026-08-01',
            'created_at' => CarbonImmutable::parse('2026-08-01', 'UTC'),
            'updated_at' => CarbonImmutable::parse('2026-08-01', 'UTC'),
        ]);
        app(SynchronizeUserSeasons::class)->execute($user)->update(['introduced_at' => now()]);

        return $user;
    }
}
