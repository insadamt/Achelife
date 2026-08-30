<?php

namespace App\Services\Portability;

use App\Data\Portability\PortableTableDefinition;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

class PortableTableRegistry
{
    /** @return list<PortableTableDefinition> */
    public function definitions(): array
    {
        return [
            $this->table('users', 'settings', ['id', 'name', 'timezone', 'calendar_started_on', 'season_rollover_preference', 'hold_next_season', 'money_preset_pack_version']),
            $this->table('seasons', 'seasons', ['id', 'user_id', 'season_number', 'start_date', 'end_date', 'season_points', 'rank', 'introduced_at', 'finalized_at', 'reflection', 'recap_seen_at', 'created_at', 'updated_at']),
            $this->table('season_intermissions', 'seasons', ['id', 'user_id', 'after_season_id', 'reason', 'started_on', 'ended_before', 'created_at', 'updated_at'], ['after_season_id' => 'seasons']),
            $this->table('task_series', 'tasks', ['id', 'user_id', 'title', 'important', 'recurrence_type', 'weekdays', 'subtask_template', 'starts_on', 'ends_before', 'materialized_through', 'created_at', 'updated_at']),
            $this->child('task_series_exclusions', 'tasks', ['id', 'task_series_id', 'occurrence_date', 'created_at', 'updated_at'], 'task_series', 'task_series_id'),
            $this->table('tasks', 'tasks', ['id', 'user_id', 'task_series_id', 'title', 'scheduled_date', 'occurrence_date', 'important', 'recurrence_type_snapshot', 'recurrence_weekdays_snapshot', 'completed_at', 'completion_timing', 'importance_at_completion', 'earned_sp', 'reward_season_id', 'created_at', 'updated_at'], ['task_series_id' => 'task_series', 'reward_season_id' => 'seasons']),
            $this->child('subtasks', 'tasks', ['id', 'task_id', 'title', 'position', 'completed_at', 'created_at', 'updated_at'], 'tasks', 'task_id'),
            $this->child('task_reschedules', 'tasks', ['id', 'task_id', 'from_date', 'to_date', 'rescheduled_at'], 'tasks', 'task_id'),
            $this->table('habits', 'habits', ['id', 'user_id', 'name', 'type', 'unit', 'starts_on', 'synchronized_through', 'current_streak', 'inactive_on', 'archived_at', 'deleted_at', 'created_at', 'updated_at']),
            $this->child('habit_definition_versions', 'habits', ['id', 'habit_id', 'effective_from', 'difficulty', 'schedule_type', 'weekdays', 'flexible', 'numeric_target', 'created_at', 'updated_at'], 'habits', 'habit_id'),
            $this->table('habit_occurrences', 'habits', ['id', 'user_id', 'habit_id', 'season_id', 'occurrence_date', 'occurrence_kind', 'state', 'numeric_value', 'target_snapshot', 'difficulty_snapshot', 'schedule_type_snapshot', 'schedule_weekdays_snapshot', 'flexible_snapshot', 'base_reward', 'streak_after', 'reward_multiplier', 'earned_sp', 'resolved_at', 'created_at', 'updated_at'], ['habit_id' => 'habits', 'season_id' => 'seasons']),
            $this->table('habit_settings', 'settings', ['user_id', 'calendar_labels', 'created_at', 'updated_at'], identityColumn: null),
            $this->table('people', 'diary', ['id', 'user_id', 'name', 'nickname', 'note', 'archived_at', 'created_at', 'updated_at']),
            $this->table('diary_entries', 'diary', ['id', 'user_id', 'season_id', 'entry_date', 'content', 'plain_text', 'valid_character_count', 'language_code', 'language_name_snapshot', 'mood', 'mood_group', 'is_completed', 'streak_after', 'reward_multiplier', 'earned_sp', 'client_revision', 'created_at', 'updated_at'], ['season_id' => 'seasons']),
            $this->child('diary_entry_mentions', 'diary', ['id', 'diary_entry_id', 'person_id', 'node_index', 'display_text', 'created_at', 'updated_at'], 'diary_entries', 'diary_entry_id', ['person_id' => 'people']),
            $this->table('diary_settings', 'settings', ['user_id', 'languages', 'created_at', 'updated_at'], identityColumn: null),
            $this->table('laws', 'constitution', ['id', 'user_id', 'name', 'severity', 'created_on', 'archived_at', 'created_at', 'updated_at']),
            $this->table('violations', 'constitution', ['id', 'user_id', 'law_id', 'season_id', 'violation_date', 'severity_snapshot', 'base_penalty_snapshot', 'sequence_number', 'penalty_sp', 'created_at', 'updated_at'], ['law_id' => 'laws', 'season_id' => 'seasons']),
            $this->table('objectives', 'objectives', ['id', 'user_id', 'season_id', 'title', 'creation_order', 'completed_at', 'earned_sp', 'deleted_at', 'created_at', 'updated_at'], ['season_id' => 'seasons']),
            $this->table('money_accounts', 'money', ['id', 'user_id', 'name', 'currency', 'initial_balance_minor', 'theme_index', 'visual_identifier', 'archived_at', 'created_at', 'updated_at']),
            $this->table('money_categories', 'money', ['id', 'user_id', 'type', 'name', 'preset_key', 'archived_at', 'created_at', 'updated_at']),
            $this->table('money_subcategories', 'money', ['id', 'user_id', 'category_id', 'name', 'preset_key', 'archived_at', 'created_at', 'updated_at'], ['category_id' => 'money_categories']),
            $this->table('money_subscriptions', 'subscriptions', ['id', 'user_id', 'name', 'amount_minor', 'account_id', 'category_id', 'subcategory_id', 'note', 'starts_on', 'materialize_from', 'ends_on', 'recurrence', 'payment_mode', 'status', 'anchor_day', 'paused_at', 'ended_at', 'created_at', 'updated_at'], ['account_id' => 'money_accounts', 'category_id' => 'money_categories', 'subcategory_id' => 'money_subcategories']),
            $this->table('money_transactions', 'money', ['id', 'user_id', 'type', 'amount_minor', 'fee_minor', 'account_id', 'destination_account_id', 'category_id', 'subcategory_id', 'transaction_date', 'note', 'created_at', 'updated_at'], ['account_id' => 'money_accounts', 'destination_account_id' => 'money_accounts', 'category_id' => 'money_categories', 'subcategory_id' => 'money_subcategories']),
            $this->table('money_subscription_occurrences', 'subscriptions', ['id', 'user_id', 'subscription_id', 'due_date', 'amount_minor', 'account_id', 'category_id', 'subcategory_id', 'note', 'payment_mode', 'status', 'transaction_id', 'paid_at', 'skipped_at', 'automatic_retry_blocked_at', 'created_at', 'updated_at'], ['subscription_id' => 'money_subscriptions', 'account_id' => 'money_accounts', 'category_id' => 'money_categories', 'subcategory_id' => 'money_subcategories', 'transaction_id' => 'money_transactions']),
            $this->table('today_settings', 'settings', ['user_id', 'show_flexible_habits', 'show_upcoming_tasks', 'created_at', 'updated_at'], identityColumn: null),
        ];
    }

    /** @return array<string, PortableTableDefinition> */
    public function keyedDefinitions(): array
    {
        $keyed = [];

        foreach ($this->definitions() as $definition) {
            $keyed[$definition->name] = $definition;
        }

        return $keyed;
    }

    /** @param array<string, list<int>> $ownedIds */
    public function queryForUser(PortableTableDefinition $definition, int $userId, array $ownedIds): Builder
    {
        $query = DB::table($definition->name)->select($definition->columns);

        if ($definition->name === 'users') {
            return $query->where('id', $userId);
        }

        if ($definition->isDirectlyUserOwned()) {
            return $query->where('user_id', $userId);
        }

        return $query->whereIn(
            $definition->ownerForeignKey,
            $ownedIds[$definition->ownerTable] ?? [],
        );
    }

    /**
     * @param  list<string>  $columns
     * @param  array<string, string>  $foreignKeys
     */
    private function table(string $name, string $module, array $columns, array $foreignKeys = [], ?string $identityColumn = 'id'): PortableTableDefinition
    {
        return new PortableTableDefinition($name, $module, $columns, $foreignKeys, $identityColumn);
    }

    /**
     * @param  list<string>  $columns
     * @param  array<string, string>  $foreignKeys
     */
    private function child(string $name, string $module, array $columns, string $ownerTable, string $ownerForeignKey, array $foreignKeys = []): PortableTableDefinition
    {
        return new PortableTableDefinition(
            $name,
            $module,
            $columns,
            [$ownerForeignKey => $ownerTable, ...$foreignKeys],
            ownerTable: $ownerTable,
            ownerForeignKey: $ownerForeignKey,
        );
    }
}
