<?php

namespace Tests\Feature\Diary;

use App\Models\DiarySetting;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\CreatesDiaryEntries;
use Tests\TestCase;

class DiaryEntryTest extends TestCase
{
    use CreatesDiaryEntries, RefreshDatabase;

    public function test_diary_defaults_to_today_and_keeps_exactly_one_autosaved_entry_per_day(): void
    {
        CarbonImmutable::setTestNow('2026-08-18 10:00:00');
        $user = $this->diaryUserCreatedOn('2026-08-01');
        $this->introduceDiarySeason($user, '2026-08-18');

        $this->actingAs($user)->get('/diary')->assertOk()->assertInertia(
            fn (Assert $page) => $page->component('diary/Index')->where('selectedDate', '2026-08-18')->where('selectedDay.state', 'pending'),
        );

        $this->autosaveDiary($user, '2026-08-18', 'short', revision: 1);
        $entry = $this->autosaveDiary($user, '2026-08-18', 'newer short draft', revision: 2);

        $this->assertSame(1, $user->diaryEntries()->count());
        $this->assertSame('newer short draft', $entry->plain_text);
        $this->assertFalse($entry->is_completed);
        $this->assertSame(0, $entry->earned_sp);
    }

    public function test_visible_character_threshold_trims_edges_counts_spaces_and_requires_language(): void
    {
        $user = $this->diaryUserCreatedOn('2026-08-01');
        $nineteen = $this->autosaveDiary($user, '2026-08-18', '1234567890123456789', revision: 1);
        $this->assertSame(19, $nineteen->valid_character_count);
        $this->assertFalse($nineteen->is_completed);

        $twenty = $this->autosaveDiary($user, '2026-08-18', '  123456789 1234567890  ', revision: 2);
        $this->assertSame(20, $twenty->valid_character_count);
        $this->assertTrue($twenty->is_completed);
        $this->assertSame(4, $twenty->earned_sp);

        $noLanguage = $this->autosaveDiary($user, '2026-08-18', '123456789 1234567890', language: null, revision: 3);
        $this->assertFalse($noLanguage->is_completed);
        $this->assertSame(0, $noLanguage->earned_sp);

        $noMood = $this->autosaveDiary($user, '2026-08-18', '123456789 1234567890', language: 'en', mood: null, moodGroup: null, revision: 4);
        $this->assertFalse($noMood->is_completed);
        $this->assertSame(0, $noMood->earned_sp);
    }

    public function test_reward_is_awarded_and_reversed_while_unrelated_season_points_remain(): void
    {
        $user = $this->diaryUserCreatedOn('2026-08-01');
        $entry = $this->autosaveDiary($user, '2026-08-18', revision: 1);
        $season = $entry->season;
        $season->increment('season_points', 12);
        $this->assertSame(16, $season->refresh()->season_points);

        $entry = $this->autosaveDiary($user, '2026-08-18', 'Too short', revision: 2);
        $this->assertFalse($entry->is_completed);
        $this->assertSame(12, $season->refresh()->season_points);
    }

    public function test_stale_autosave_revision_cannot_overwrite_newer_content(): void
    {
        $user = $this->diaryUserCreatedOn('2026-08-01');
        $this->autosaveDiary($user, '2026-08-18', 'Newest persisted writing', revision: 10);
        $entry = $this->autosaveDiary($user, '2026-08-18', 'stale', revision: 9);

        $this->assertSame('Newest persisted writing', $entry->plain_text);
        $this->assertSame(10, $entry->client_revision);
    }

    public function test_current_season_can_be_backfilled_but_completed_season_is_locked(): void
    {
        $user = $this->diaryUserCreatedOn('2026-08-01');
        $entry = $this->autosaveDiary($user, '2026-08-10', today: '2026-08-18');
        $this->assertTrue($entry->is_completed);

        $this->expectException(ValidationException::class);
        $this->autosaveDiary($user, '2026-08-10', revision: 2, today: '2026-09-01');
    }

    public function test_language_settings_preserve_historical_entry_and_rtl_metadata(): void
    {
        CarbonImmutable::setTestNow('2026-08-18');
        $user = $this->diaryUserCreatedOn('2026-08-01');
        $entry = $this->autosaveDiary($user, '2026-08-18', language: 'ar');
        DiarySetting::query()->where('user_id', $user->id)->update(['languages' => ['en']]);
        $user->seasons()->update(['introduced_at' => now()]);

        $this->assertSame('ar', $entry->refresh()->language_code);
        $this->assertSame('Arabic', $entry->language_name_snapshot);
        $this->actingAs($user)->get('/diary')->assertInertia(fn (Assert $page) => $page->where('selectedDay.direction', 'rtl'));
    }

    public function test_mood_is_required_for_completion_and_clearing_it_reverses_reward(): void
    {
        $user = $this->diaryUserCreatedOn('2026-08-01');
        $entry = $this->autosaveDiary($user, '2026-08-18', mood: 'peaceful', moodGroup: 'calm', revision: 1);
        $this->assertSame('peaceful', $entry->mood);
        $this->assertSame(4, $entry->earned_sp);

        $entry = $this->autosaveDiary($user, '2026-08-18', mood: null, moodGroup: null, revision: 2);
        $this->assertNull($entry->mood);
        $this->assertFalse($entry->is_completed);
        $this->assertSame(0, $entry->earned_sp);
    }
}
