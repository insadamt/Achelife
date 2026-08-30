<?php

namespace App\Models;

use App\Enums\MoneySubscriptionPaymentMode;
use App\Enums\MoneySubscriptionRecurrence;
use App\Enums\MoneySubscriptionStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'name', 'amount_minor', 'account_id', 'category_id', 'subcategory_id', 'note', 'starts_on', 'materialize_from', 'ends_on', 'recurrence', 'payment_mode', 'status', 'anchor_day', 'paused_at', 'ended_at'])]
class MoneySubscription extends Model
{
    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<MoneyAccount, $this> */
    public function account(): BelongsTo
    {
        return $this->belongsTo(MoneyAccount::class);
    }

    /** @return BelongsTo<MoneyCategory, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(MoneyCategory::class);
    }

    /** @return BelongsTo<MoneySubcategory, $this> */
    public function subcategory(): BelongsTo
    {
        return $this->belongsTo(MoneySubcategory::class);
    }

    /** @return HasMany<MoneySubscriptionOccurrence, $this> */
    public function occurrences(): HasMany
    {
        return $this->hasMany(MoneySubscriptionOccurrence::class, 'subscription_id');
    }

    protected function casts(): array
    {
        return [
            'amount_minor' => 'integer',
            'starts_on' => 'immutable_date',
            'materialize_from' => 'immutable_date',
            'ends_on' => 'immutable_date',
            'recurrence' => MoneySubscriptionRecurrence::class,
            'payment_mode' => MoneySubscriptionPaymentMode::class,
            'status' => MoneySubscriptionStatus::class,
            'anchor_day' => 'integer',
            'paused_at' => 'immutable_datetime',
            'ended_at' => 'immutable_datetime',
        ];
    }
}
