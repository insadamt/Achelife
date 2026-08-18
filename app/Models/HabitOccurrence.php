<?php

namespace App\Models;

use App\Enums\HabitDifficulty;
use App\Enums\HabitOccurrenceKind;
use App\Enums\HabitOccurrenceState;
use App\Enums\HabitScheduleType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id',
    'habit_id',
    'season_id',
    'occurrence_date',
    'occurrence_kind',
    'state',
    'numeric_value',
    'target_snapshot',
    'difficulty_snapshot',
    'schedule_type_snapshot',
    'schedule_weekdays_snapshot',
    'flexible_snapshot',
    'base_reward',
    'streak_after',
    'reward_multiplier',
    'earned_sp',
    'resolved_at',
])]
class HabitOccurrence extends Model
{
    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Habit, $this> */
    public function habit(): BelongsTo
    {
        return $this->belongsTo(Habit::class)->withTrashed();
    }

    /** @return BelongsTo<Season, $this> */
    public function season(): BelongsTo
    {
        return $this->belongsTo(Season::class);
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'occurrence_date' => 'immutable_date',
            'occurrence_kind' => HabitOccurrenceKind::class,
            'state' => HabitOccurrenceState::class,
            'numeric_value' => 'decimal:3',
            'target_snapshot' => 'decimal:3',
            'difficulty_snapshot' => HabitDifficulty::class,
            'schedule_type_snapshot' => HabitScheduleType::class,
            'schedule_weekdays_snapshot' => 'array',
            'flexible_snapshot' => 'boolean',
            'base_reward' => 'integer',
            'streak_after' => 'integer',
            'reward_multiplier' => 'decimal:1',
            'earned_sp' => 'integer',
            'resolved_at' => 'immutable_datetime',
        ];
    }
}
