<?php

namespace Tests\Feature\Portability;

use App\Actions\Portability\RestoreAccountArchive;
use App\Data\Portability\AccountRestoreRequest;
use App\Models\Season;
use App\Models\User;
use App\Services\Portability\AccountArchiveExporter;
use App\Services\Portability\AccountArchivePreviewer;
use App\Services\Portability\AccountArchiveValidator;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class RestoreCatchUpTest extends TestCase
{
    use RefreshDatabase;

    #[DataProvider('staleRestoreDates')]
    public function test_stale_backups_catch_up_only_through_original_day_thirty_without_fabricated_seasons(string $restoreDate): void
    {
        CarbonImmutable::setTestNow('2026-08-05 12:00:00');
        $source = $this->createCatchUpSource();
        $archivePath = app(AccountArchiveExporter::class)->export($source);

        try {
            CarbonImmutable::setTestNow($restoreDate.' 12:00:00');
            $validated = app(AccountArchiveValidator::class)->validate($archivePath);
            $preview = app(AccountArchivePreviewer::class)->preview($validated);
            $this->assertSame('2026-08-30', $preview['catchUp']['throughDate']);
            $this->assertSame(26, $preview['catchUp']['habitMisses']);
            $this->assertSame(26, $preview['catchUp']['diary']['missedDays']);
            $this->assertSame(25, $preview['catchUp']['recurringTaskOccurrences']);
            $this->assertSame(1, $preview['catchUp']['subscriptions']['automaticCount']);
            $this->assertSame(500, $preview['catchUp']['subscriptions']['automaticValueMinor']);
            $this->assertSame(['USD' => 500], $preview['catchUp']['subscriptions']['automaticValueMinorByCurrency']);

            $target = User::factory()->create(['onboarding_step' => 'path', 'onboarding_completed_at' => null]);
            app(RestoreAccountArchive::class)->execute($target, $validated, new AccountRestoreRequest(freshInstall: true));
            $target->refresh();

            $this->assertSame(1, $target->seasons()->count());
            $this->assertSame(1, $target->seasons()->whereNotNull('finalized_at')->count());
            $this->assertSame(26, $target->tasks()->count());
            $this->assertSame(26, $target->habitOccurrences()->where('state', 'missed')->count());
            $this->assertSame(1, $target->moneyTransactions()->where('note', 'Bounded subscription')->count());
            $this->assertSame(2, $target->moneySubscriptionOccurrences()->count());
            $this->assertSame('restore', $target->seasonIntermissions()->sole()->reason->value);
            $this->assertNull($target->seasonIntermissions()->sole()->ended_before);
        } finally {
            @unlink($archivePath);
        }
    }

    /** @return array<string, array{string}> */
    public static function staleRestoreDates(): array
    {
        return [
            'month-long absence' => ['2026-10-15'],
            'year-long absence' => ['2027-09-15'],
        ];
    }

    private function createCatchUpSource(): User
    {
        $user = User::factory()->create(['timezone' => 'UTC', 'calendar_started_on' => '2026-08-01']);
        $season = Season::query()->create(['user_id' => $user->id, 'season_number' => 1, 'start_date' => '2026-08-01', 'end_date' => '2026-08-30', 'season_points' => 0, 'introduced_at' => now()]);
        $seriesId = DB::table('task_series')->insertGetId(['user_id' => $user->id, 'title' => 'Daily review', 'important' => false, 'recurrence_type' => 'daily', 'weekdays' => null, 'subtask_template' => null, 'starts_on' => '2026-08-05', 'ends_before' => null, 'materialized_through' => '2026-08-05', 'created_at' => now(), 'updated_at' => now()]);
        DB::table('tasks')->insert(['user_id' => $user->id, 'task_series_id' => $seriesId, 'title' => 'Daily review', 'scheduled_date' => '2026-08-05', 'occurrence_date' => '2026-08-05', 'important' => false, 'recurrence_type_snapshot' => 'daily', 'recurrence_weekdays_snapshot' => null, 'completed_at' => null, 'completion_timing' => null, 'importance_at_completion' => null, 'earned_sp' => null, 'reward_season_id' => null, 'created_at' => now(), 'updated_at' => now()]);
        $habitId = DB::table('habits')->insertGetId(['user_id' => $user->id, 'name' => 'Daily walk', 'type' => 'boolean', 'unit' => null, 'starts_on' => '2026-08-05', 'synchronized_through' => '2026-08-05', 'current_streak' => 0, 'inactive_on' => null, 'archived_at' => null, 'deleted_at' => null, 'created_at' => now(), 'updated_at' => now()]);
        DB::table('habit_definition_versions')->insert(['habit_id' => $habitId, 'effective_from' => '2026-08-05', 'difficulty' => 'normal', 'schedule_type' => 'every_day', 'weekdays' => null, 'flexible' => false, 'numeric_target' => null, 'created_at' => now(), 'updated_at' => now()]);
        DB::table('habit_occurrences')->insert(['user_id' => $user->id, 'habit_id' => $habitId, 'season_id' => $season->id, 'occurrence_date' => '2026-08-05', 'occurrence_kind' => 'required', 'state' => 'pending', 'numeric_value' => null, 'target_snapshot' => null, 'difficulty_snapshot' => 'normal', 'schedule_type_snapshot' => 'every_day', 'schedule_weekdays_snapshot' => null, 'flexible_snapshot' => false, 'base_reward' => 4, 'streak_after' => 0, 'reward_multiplier' => 0, 'earned_sp' => 0, 'resolved_at' => null, 'created_at' => now(), 'updated_at' => now()]);
        $accountId = DB::table('money_accounts')->insertGetId(['user_id' => $user->id, 'name' => 'Main', 'currency' => 'USD', 'initial_balance_minor' => 5000, 'theme_index' => 1, 'visual_identifier' => '1111', 'archived_at' => null, 'created_at' => now(), 'updated_at' => now()]);
        $categoryId = DB::table('money_categories')->insertGetId(['user_id' => $user->id, 'type' => 'expense', 'name' => 'Bills', 'preset_key' => null, 'archived_at' => null, 'created_at' => now(), 'updated_at' => now()]);
        $subscriptionId = DB::table('money_subscriptions')->insertGetId(['user_id' => $user->id, 'name' => 'Bounded subscription', 'amount_minor' => 500, 'account_id' => $accountId, 'category_id' => $categoryId, 'subcategory_id' => null, 'note' => 'Bounded subscription', 'starts_on' => '2026-08-10', 'materialize_from' => '2026-08-10', 'ends_on' => null, 'recurrence' => 'monthly', 'payment_mode' => 'automatic', 'status' => 'active', 'anchor_day' => 10, 'paused_at' => null, 'ended_at' => null, 'created_at' => now(), 'updated_at' => now()]);
        DB::table('money_subscription_occurrences')->insert(['user_id' => $user->id, 'subscription_id' => $subscriptionId, 'due_date' => '2026-08-10', 'amount_minor' => 500, 'account_id' => $accountId, 'category_id' => $categoryId, 'subcategory_id' => null, 'note' => 'Bounded subscription', 'payment_mode' => 'automatic', 'status' => 'due', 'transaction_id' => null, 'paid_at' => null, 'skipped_at' => null, 'automatic_retry_blocked_at' => null, 'created_at' => now(), 'updated_at' => now()]);

        return $user;
    }
}
