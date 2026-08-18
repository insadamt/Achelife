<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id', 'season_id', 'entry_date', 'content', 'plain_text', 'valid_character_count',
    'language_code', 'language_name_snapshot', 'mood', 'mood_group', 'is_completed',
    'streak_after', 'reward_multiplier', 'earned_sp', 'client_revision',
])]
class DiaryEntry extends Model
{
    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Season, $this> */
    public function season(): BelongsTo
    {
        return $this->belongsTo(Season::class);
    }

    /** @return HasMany<DiaryEntryMention, $this> */
    public function mentions(): HasMany
    {
        return $this->hasMany(DiaryEntryMention::class);
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'entry_date' => 'immutable_date',
            'content' => 'array',
            'valid_character_count' => 'integer',
            'is_completed' => 'boolean',
            'streak_after' => 'integer',
            'reward_multiplier' => 'decimal:1',
            'earned_sp' => 'integer',
            'client_revision' => 'integer',
        ];
    }
}
