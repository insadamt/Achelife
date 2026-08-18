<?php

namespace App\Models;

use App\Enums\HabitDifficulty;
use App\Enums\HabitScheduleType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'habit_id',
    'effective_from',
    'difficulty',
    'schedule_type',
    'weekdays',
    'flexible',
    'numeric_target',
])]
class HabitDefinitionVersion extends Model
{
    /** @return BelongsTo<Habit, $this> */
    public function habit(): BelongsTo
    {
        return $this->belongsTo(Habit::class);
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'effective_from' => 'immutable_date',
            'difficulty' => HabitDifficulty::class,
            'schedule_type' => HabitScheduleType::class,
            'weekdays' => 'array',
            'flexible' => 'boolean',
            'numeric_target' => 'decimal:3',
        ];
    }
}
