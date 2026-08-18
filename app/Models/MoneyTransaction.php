<?php

namespace App\Models;

use App\Enums\MoneyTransactionType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'type', 'amount_minor', 'account_id', 'destination_account_id', 'category_id', 'subcategory_id', 'transaction_date', 'note'])]
class MoneyTransaction extends Model
{
    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<MoneyAccount, $this> */
    public function account(): BelongsTo
    {
        return $this->belongsTo(MoneyAccount::class, 'account_id');
    }

    /** @return BelongsTo<MoneyAccount, $this> */
    public function destinationAccount(): BelongsTo
    {
        return $this->belongsTo(MoneyAccount::class, 'destination_account_id');
    }

    /** @return BelongsTo<MoneyCategory, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(MoneyCategory::class, 'category_id');
    }

    /** @return BelongsTo<MoneySubcategory, $this> */
    public function subcategory(): BelongsTo
    {
        return $this->belongsTo(MoneySubcategory::class, 'subcategory_id');
    }

    protected function casts(): array
    {
        return [
            'type' => MoneyTransactionType::class,
            'amount_minor' => 'integer',
            'transaction_date' => 'immutable_date',
        ];
    }
}
