<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['diary_entry_id', 'person_id', 'node_index', 'display_text'])]
class DiaryEntryMention extends Model
{
    /** @return BelongsTo<DiaryEntry, $this> */
    public function entry(): BelongsTo
    {
        return $this->belongsTo(DiaryEntry::class, 'diary_entry_id');
    }

    /** @return BelongsTo<Person, $this> */
    public function person(): BelongsTo
    {
        return $this->belongsTo(Person::class);
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['node_index' => 'integer'];
    }
}
