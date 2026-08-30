<?php

namespace Tests\Concerns;

use App\Models\Season;
use App\Models\User;
use Illuminate\Support\Facades\DB;

trait BuildsPortableAccounts
{
    /** @return array<string, int> */
    protected function buildCompletePortableGraph(User $user): array
    {
        $user->update([
            'timezone' => 'UTC',
            'calendar_started_on' => '2026-08-01',
            'season_rollover_preference' => 'manual',
            'money_preset_pack_version' => 1,
        ]);
        $season = Season::query()->create([
            'user_id' => $user->id,
            'season_number' => 1,
            'start_date' => '2026-08-01',
            'end_date' => '2026-08-30',
            'season_points' => 106,
            'rank' => 'bronze_ii',
            'introduced_at' => '2026-08-01 08:00:00',
            'finalized_at' => '2026-08-31 00:00:00',
            'reflection' => 'Protected the essentials.',
            'recap_seen_at' => '2026-08-31 08:00:00',
        ]);
        DB::table('season_intermissions')->insert([
            'user_id' => $user->id,
            'after_season_id' => $season->id,
            'reason' => 'manual_rollover',
            'started_on' => '2026-08-31',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $seriesId = DB::table('task_series')->insertGetId([
            'user_id' => $user->id,
            'title' => 'Review plan',
            'important' => true,
            'recurrence_type' => 'daily',
            'weekdays' => null,
            'subtask_template' => json_encode(['Open notes']),
            'starts_on' => '2026-08-01',
            'ends_before' => null,
            'materialized_through' => '2026-08-02',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('task_series_exclusions')->insert(['task_series_id' => $seriesId, 'occurrence_date' => '2026-08-03', 'created_at' => now(), 'updated_at' => now()]);
        $taskId = DB::table('tasks')->insertGetId([
            'user_id' => $user->id,
            'task_series_id' => $seriesId,
            'title' => 'Review plan',
            'scheduled_date' => '2026-08-02',
            'occurrence_date' => '2026-08-02',
            'important' => true,
            'recurrence_type_snapshot' => 'daily',
            'recurrence_weekdays_snapshot' => null,
            'completed_at' => '2026-08-02 10:00:00',
            'completion_timing' => 'on_time',
            'importance_at_completion' => true,
            'earned_sp' => 8,
            'reward_season_id' => $season->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('subtasks')->insert(['task_id' => $taskId, 'title' => 'Open notes', 'position' => 0, 'completed_at' => '2026-08-02 09:55:00', 'created_at' => now(), 'updated_at' => now()]);
        DB::table('task_reschedules')->insert(['task_id' => $taskId, 'from_date' => '2026-08-01', 'to_date' => '2026-08-02', 'rescheduled_at' => '2026-08-01 12:00:00']);

        $habitId = DB::table('habits')->insertGetId([
            'user_id' => $user->id,
            'name' => 'Walk',
            'type' => 'boolean',
            'unit' => null,
            'starts_on' => '2026-08-01',
            'synchronized_through' => '2026-08-01',
            'current_streak' => 1,
            'inactive_on' => null,
            'archived_at' => null,
            'deleted_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('habit_definition_versions')->insert(['habit_id' => $habitId, 'effective_from' => '2026-08-01', 'difficulty' => 'normal', 'schedule_type' => 'every_day', 'weekdays' => null, 'flexible' => false, 'numeric_target' => null, 'created_at' => now(), 'updated_at' => now()]);
        DB::table('habit_occurrences')->insert([
            'user_id' => $user->id,
            'habit_id' => $habitId,
            'season_id' => $season->id,
            'occurrence_date' => '2026-08-01',
            'occurrence_kind' => 'required',
            'state' => 'completed',
            'numeric_value' => null,
            'target_snapshot' => null,
            'difficulty_snapshot' => 'normal',
            'schedule_type_snapshot' => 'every_day',
            'schedule_weekdays_snapshot' => null,
            'flexible_snapshot' => false,
            'base_reward' => 4,
            'streak_after' => 1,
            'reward_multiplier' => 1,
            'earned_sp' => 4,
            'resolved_at' => '2026-08-01 20:00:00',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('habit_settings')->insert(['user_id' => $user->id, 'calendar_labels' => 'season_days', 'created_at' => now(), 'updated_at' => now()]);

        $personId = DB::table('people')->insertGetId(['user_id' => $user->id, 'name' => 'Sam', 'nickname' => 'S', 'note' => 'Trusted friend', 'archived_at' => null, 'created_at' => now(), 'updated_at' => now()]);
        $diaryEntryId = DB::table('diary_entries')->insertGetId([
            'user_id' => $user->id,
            'season_id' => $season->id,
            'entry_date' => '2026-08-01',
            'content' => json_encode([['type' => 'text', 'text' => 'A meaningful day with '], ['type' => 'mention', 'personId' => $personId, 'label' => 'Sam']]),
            'plain_text' => 'A meaningful day with Sam',
            'valid_character_count' => 25,
            'language_code' => 'en',
            'language_name_snapshot' => 'English',
            'mood' => 'joyful',
            'mood_group' => 'happy',
            'is_completed' => true,
            'streak_after' => 1,
            'reward_multiplier' => 1,
            'earned_sp' => 4,
            'client_revision' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('diary_entry_mentions')->insert(['diary_entry_id' => $diaryEntryId, 'person_id' => $personId, 'node_index' => 1, 'display_text' => 'Sam', 'created_at' => now(), 'updated_at' => now()]);
        DB::table('diary_settings')->insert(['user_id' => $user->id, 'languages' => json_encode(['en']), 'created_at' => now(), 'updated_at' => now()]);

        $lawId = DB::table('laws')->insertGetId(['user_id' => $user->id, 'name' => 'Protect sleep', 'severity' => 'minor', 'created_on' => '2026-08-01', 'archived_at' => null, 'created_at' => now(), 'updated_at' => now()]);
        DB::table('violations')->insert(['user_id' => $user->id, 'law_id' => $lawId, 'season_id' => $season->id, 'violation_date' => '2026-08-04', 'severity_snapshot' => 'minor', 'base_penalty_snapshot' => '-10', 'sequence_number' => 1, 'penalty_sp' => -10, 'created_at' => now(), 'updated_at' => now()]);
        DB::table('objectives')->insert(['user_id' => $user->id, 'season_id' => $season->id, 'title' => 'Ship carefully', 'creation_order' => 1, 'completed_at' => '2026-08-20 10:00:00', 'earned_sp' => 100, 'deleted_at' => null, 'created_at' => now(), 'updated_at' => now()]);

        $accountId = DB::table('money_accounts')->insertGetId(['user_id' => $user->id, 'name' => 'Main', 'currency' => 'USD', 'initial_balance_minor' => 10000, 'theme_index' => 1, 'visual_identifier' => '1234', 'archived_at' => null, 'created_at' => now(), 'updated_at' => now()]);
        $destinationAccountId = DB::table('money_accounts')->insertGetId(['user_id' => $user->id, 'name' => 'Savings', 'currency' => 'USD', 'initial_balance_minor' => 0, 'theme_index' => 2, 'visual_identifier' => '5678', 'archived_at' => null, 'created_at' => now(), 'updated_at' => now()]);
        $categoryId = DB::table('money_categories')->insertGetId(['user_id' => $user->id, 'type' => 'expense', 'name' => 'Financial', 'preset_key' => 'money.expense.financial', 'archived_at' => null, 'created_at' => now(), 'updated_at' => now()]);
        $subcategoryId = DB::table('money_subcategories')->insertGetId(['user_id' => $user->id, 'category_id' => $categoryId, 'name' => 'Bank Fees', 'preset_key' => 'money.expense.financial.bank-fees', 'archived_at' => null, 'created_at' => now(), 'updated_at' => now()]);
        DB::table('money_transactions')->insert(['user_id' => $user->id, 'type' => 'transfer', 'amount_minor' => 1000, 'fee_minor' => 25, 'account_id' => $accountId, 'destination_account_id' => $destinationAccountId, 'category_id' => null, 'subcategory_id' => null, 'transaction_date' => '2026-08-05', 'note' => 'Move with fee', 'created_at' => now(), 'updated_at' => now()]);
        $paymentTransactionId = DB::table('money_transactions')->insertGetId(['user_id' => $user->id, 'type' => 'expense', 'amount_minor' => 500, 'fee_minor' => 0, 'account_id' => $accountId, 'destination_account_id' => null, 'category_id' => $categoryId, 'subcategory_id' => $subcategoryId, 'transaction_date' => '2026-08-10', 'note' => 'Membership', 'created_at' => now(), 'updated_at' => now()]);
        $subscriptionId = DB::table('money_subscriptions')->insertGetId(['user_id' => $user->id, 'name' => 'Membership', 'amount_minor' => 500, 'account_id' => $accountId, 'category_id' => $categoryId, 'subcategory_id' => $subcategoryId, 'note' => 'Membership', 'starts_on' => '2026-08-10', 'materialize_from' => '2026-08-10', 'ends_on' => null, 'recurrence' => 'weekly', 'payment_mode' => 'automatic', 'status' => 'active', 'anchor_day' => 10, 'paused_at' => null, 'ended_at' => null, 'created_at' => now(), 'updated_at' => now()]);
        DB::table('money_subscription_occurrences')->insert(['user_id' => $user->id, 'subscription_id' => $subscriptionId, 'due_date' => '2026-08-10', 'amount_minor' => 500, 'account_id' => $accountId, 'category_id' => $categoryId, 'subcategory_id' => $subcategoryId, 'note' => 'Membership', 'payment_mode' => 'automatic', 'status' => 'paid', 'transaction_id' => $paymentTransactionId, 'paid_at' => '2026-08-10 09:00:00', 'skipped_at' => null, 'automatic_retry_blocked_at' => null, 'created_at' => now(), 'updated_at' => now()]);
        DB::table('money_subscription_occurrences')->insert(['user_id' => $user->id, 'subscription_id' => $subscriptionId, 'due_date' => '2026-08-17', 'amount_minor' => 500, 'account_id' => $accountId, 'category_id' => $categoryId, 'subcategory_id' => $subcategoryId, 'note' => 'Membership', 'payment_mode' => 'automatic', 'status' => 'skipped', 'transaction_id' => null, 'paid_at' => null, 'skipped_at' => '2026-08-17 09:00:00', 'automatic_retry_blocked_at' => null, 'created_at' => now(), 'updated_at' => now()]);
        DB::table('today_settings')->insert(['user_id' => $user->id, 'show_flexible_habits' => false, 'show_upcoming_tasks' => true, 'created_at' => now(), 'updated_at' => now()]);

        return [
            'seasonId' => $season->id,
            'personId' => $personId,
            'accountId' => $accountId,
            'destinationAccountId' => $destinationAccountId,
            'categoryId' => $categoryId,
            'subcategoryId' => $subcategoryId,
            'subscriptionId' => $subscriptionId,
            'paymentTransactionId' => $paymentTransactionId,
        ];
    }
}
