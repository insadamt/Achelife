<?php

namespace App\Models;

use App\Enums\HabitType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'user_id',
    'name',
    'type',
    'unit',
    'starts_on',
    'synchronized_through',
    'current_streak',
    'inactive_on',
    'archived_at',
])]
class Habit extends Model
{
    use SoftDeletes;

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<HabitDefinitionVersion, $this> */
    public function definitionVersions(): HasMany
    {
        return $this->hasMany(HabitDefinitionVersion::class)->orderBy('effective_from');
    }

    /** @return HasMany<HabitOccurrence, $this> */
    public function occurrences(): HasMany
    {
        return $this->hasMany(HabitOccurrence::class)->orderBy('occurrence_date');
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'type' => HabitType::class,
            'starts_on' => 'immutable_date',
            'synchronized_through' => 'immutable_date',
            'current_streak' => 'integer',
            'inactive_on' => 'immutable_date',
            'archived_at' => 'immutable_datetime',
            'deleted_at' => 'immutable_datetime',
        ];
    }
}
