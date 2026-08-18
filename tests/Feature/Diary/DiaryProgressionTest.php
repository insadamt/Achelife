<?php

namespace Tests\Feature\Diary;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesDiaryEntries;
use Tests\TestCase;

class DiaryProgressionTest extends TestCase
{
    use CreatesDiaryEntries, RefreshDatabase;

    public function test_tenth_and_twentieth_completed_days_use_writing_multipliers(): void
    {
        $user = $this->diaryUserCreatedOn('2026-08-01');

        for ($day = 1; $day <= 20; $day++) {
            $date = '2026-08-'.str_pad((string) $day, 2, '0', STR_PAD_LEFT);
            $this->autosaveDiary($user, $date, revision: $day);
        }

        $tenth = $user->diaryEntries()->whereDate('entry_date', '2026-08-10')->firstOrFail();
        $twentieth = $user->diaryEntries()->whereDate('entry_date', '2026-08-20')->firstOrFail();
        $this->assertSame(10, $tenth->streak_after);
        $this->assertSame('1.5', $tenth->reward_multiplier);
        $this->assertSame(6, $tenth->earned_sp);
        $this->assertSame(20, $twentieth->streak_after);
        $this->assertSame('2.0', $twentieth->reward_multiplier);
        $this->assertSame(8, $twentieth->earned_sp);
        $this->assertSame(104, $user->seasons()->where('season_number', 1)->value('season_points'));
    }

    public function test_missed_day_breaks_streak_and_backfill_replays_downstream_rewards_by_exact_delta(): void
    {
        $user = $this->diaryUserCreatedOn('2026-08-01');

        for ($day = 1; $day <= 9; $day++) {
            $date = '2026-08-'.str_pad((string) $day, 2, '0', STR_PAD_LEFT);
            $this->autosaveDiary($user, $date, revision: $day);
        }
        $dayEleven = $this->autosaveDiary($user, '2026-08-11', revision: 11);
        $season = $dayEleven->season;
        $season->increment('season_points', 16);

        $this->assertSame(1, $dayEleven->streak_after);
        $this->assertSame(56, $season->refresh()->season_points);

        $dayTen = $this->autosaveDiary($user, '2026-08-10', revision: 10, today: '2026-08-11');

        $this->assertSame(10, $dayTen->streak_after);
        $this->assertSame(6, $dayTen->earned_sp);
        $this->assertSame(11, $dayEleven->refresh()->streak_after);
        $this->assertSame(6, $dayEleven->earned_sp);
        $this->assertSame(64, $season->refresh()->season_points);
    }

    public function test_streak_continues_across_season_boundary_from_immutable_baseline(): void
    {
        $user = $this->diaryUserCreatedOn('2026-01-01');
        $this->autosaveDiary($user, '2026-01-29', revision: 1);
        $this->autosaveDiary($user, '2026-01-30', revision: 2);
        $third = $this->autosaveDiary($user, '2026-01-31', revision: 3);

        $this->assertSame(2, $third->season->season_number);
        $this->assertSame(3, $third->streak_after);
        $this->assertSame(4, $third->earned_sp);
    }
}
