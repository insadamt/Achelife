<?php

namespace App\Actions\Money;

use App\Data\Money\MoneySelectionSnapshot;
use App\Data\Money\MoneyTransactionData;
use App\Models\MoneyAccount;
use App\Models\MoneyTransaction;
use App\Models\User;
use App\Services\Money\MoneyTransactionMetadata;
use App\Services\Money\MoneyTransactionValidator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SaveMoneyTransaction
{
    public function __construct(
        private readonly MoneyTransactionValidator $validator,
        private readonly MoneyTransactionMetadata $metadata,
    ) {}

    public function create(User $user, MoneyTransactionData $data): MoneyTransaction
    {
        return DB::transaction(function () use ($user, $data): MoneyTransaction {
            $this->lockAccounts($user, $data);
            $this->validator->validate($user, $data);
            $metadata = $this->metadata->createOrFind($user, $data);
            $transaction = $user->moneyTransactions()->create($this->attributes($data, $metadata['merchantId']));
            $this->metadata->assignTags($user, $transaction, $metadata['tags']);

            return $transaction->refresh();
        }, 3);
    }

    public function createRetainingSelections(
        User $user,
        MoneyTransactionData $data,
        MoneySelectionSnapshot $retained,
    ): MoneyTransaction {
        return DB::transaction(function () use ($user, $data, $retained): MoneyTransaction {
            $this->lockAccounts($user, $data);
            $this->validator->validate($user, $data, retained: $retained);
            $metadata = $this->metadata->createOrFind($user, $data);
            $transaction = $user->moneyTransactions()->create($this->attributes($data, $metadata['merchantId']));
            $this->metadata->assignTags($user, $transaction, $metadata['tags']);

            return $transaction->refresh();
        }, 3);
    }

    public function update(User $user, MoneyTransaction $transaction, MoneyTransactionData $data): MoneyTransaction
    {
        if ($transaction->user_id !== $user->id) {
            throw ValidationException::withMessages(['transaction' => 'This transaction does not belong to you.']);
        }

        if ($transaction->type !== $data->type) {
            throw ValidationException::withMessages(['type' => 'A transaction type cannot be changed after creation.']);
        }

        return DB::transaction(function () use ($user, $transaction, $data): MoneyTransaction {
            $lockedTransaction = MoneyTransaction::query()->lockForUpdate()->findOrFail($transaction->id);
            if ($lockedTransaction->subscriptionOccurrence()->exists()) {
                throw ValidationException::withMessages([
                    'transaction' => 'Subscription payments are edited from their occurrence so the snapshot and transaction stay consistent.',
                ]);
            }
            if ($lockedTransaction->openedDebt()->exists() || $lockedTransaction->debtSettlement()->exists()) {
                throw ValidationException::withMessages([
                    'transaction' => 'Debt movements are changed from Debts so the outstanding balance and Account stay consistent.',
                ]);
            }
            $this->lockAccounts($user, $data, $lockedTransaction);
            $this->validator->validate($user, $data, $lockedTransaction);
            $metadata = $this->metadata->createOrFind($user, $data, $lockedTransaction);
            $lockedTransaction->update($this->attributes($data, $metadata['merchantId']));
            $this->metadata->assignTags($user, $lockedTransaction, $metadata['tags']);

            return $lockedTransaction->refresh();
        }, 3);
    }

    private function lockAccounts(User $user, MoneyTransactionData $data, ?MoneyTransaction $existing = null): void
    {
        $ids = array_filter([
            $data->accountId,
            $data->destinationAccountId,
            $existing?->account_id,
            $existing?->destination_account_id,
        ]);
        $lockedCount = MoneyAccount::query()
            ->where('user_id', $user->id)
            ->whereIn('id', array_unique($ids))
            ->lockForUpdate()
            ->count();

        if ($lockedCount !== count(array_unique($ids))) {
            throw ValidationException::withMessages(['account_id' => 'Every Account must belong to you.']);
        }
    }

    /** @return array<string, mixed> */
    private function attributes(MoneyTransactionData $data, ?int $merchantId): array
    {
        return [
            'type' => $data->type,
            'amount_minor' => $data->amountMinor,
            'fee_minor' => $data->feeMinor,
            'account_id' => $data->accountId,
            'destination_account_id' => $data->destinationAccountId,
            'category_id' => $data->categoryId,
            'subcategory_id' => $data->subcategoryId,
            'merchant_id' => $merchantId,
            'transaction_date' => $data->date,
            'note' => $data->note,
        ];
    }
}
