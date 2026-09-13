<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['user_id', 'name', 'normalized_name', 'color', 'archived_at'])]
class MoneyTag extends Model
{
    protected function casts(): array
    {
        return ['archived_at' => 'datetime'];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsToMany<MoneyTransaction, $this> */
    public function transactions(): BelongsToMany
    {
        return $this->belongsToMany(MoneyTransaction::class, 'money_transaction_tags', 'tag_id', 'transaction_id')
            ->withTimestamps();
    }
}
