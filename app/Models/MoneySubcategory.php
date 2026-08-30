<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'category_id', 'name', 'preset_key', 'archived_at'])]
class MoneySubcategory extends Model
{
    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<MoneyCategory, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(MoneyCategory::class, 'category_id');
    }

    /** @return HasMany<MoneyTransaction, $this> */
    public function transactions(): HasMany
    {
        return $this->hasMany(MoneyTransaction::class, 'subcategory_id');
    }

    /** @return HasMany<MoneySubscription, $this> */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(MoneySubscription::class, 'subcategory_id');
    }

    /** @return HasMany<MoneySubscriptionOccurrence, $this> */
    public function subscriptionOccurrences(): HasMany
    {
        return $this->hasMany(MoneySubscriptionOccurrence::class, 'subcategory_id');
    }

    protected function casts(): array
    {
        return ['archived_at' => 'immutable_datetime'];
    }
}
