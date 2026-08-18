<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'name', 'nickname', 'note', 'archived_at'])]
class Person extends Model
{
    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<DiaryEntryMention, $this> */
    public function mentions(): HasMany
    {
        return $this->hasMany(DiaryEntryMention::class);
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['archived_at' => 'immutable_datetime'];
    }
}
