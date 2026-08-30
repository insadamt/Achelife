<?php

namespace App\Models;

use App\Enums\MoneySubscriptionOccurrenceStatus;
use App\Enums\MoneySubscriptionPaymentMode;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'subscription_id', 'due_date', 'amount_minor', 'account_id', 'category_id', 'subcategory_id', 'note', 'payment_mode', 'status', 'transaction_id', 'paid_at', 'skipped_at', 'automatic_retry_blocked_at'])]
class MoneySubscriptionOccurrence extends Model
{
    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<MoneySubscription, $this> */
    public function subscription(): BelongsTo
    {
        return $this->belongsTo(MoneySubscription::class, 'subscription_id');
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

    /** @return BelongsTo<MoneyTransaction, $this> */
    public function transaction(): BelongsTo
    {
        return $this->belongsTo(MoneyTransaction::class, 'transaction_id');
    }

    protected function casts(): array
    {
        return [
            'due_date' => 'immutable_date',
            'amount_minor' => 'integer',
            'payment_mode' => MoneySubscriptionPaymentMode::class,
            'status' => MoneySubscriptionOccurrenceStatus::class,
            'paid_at' => 'immutable_datetime',
            'skipped_at' => 'immutable_datetime',
            'automatic_retry_blocked_at' => 'immutable_datetime',
        ];
    }
}
