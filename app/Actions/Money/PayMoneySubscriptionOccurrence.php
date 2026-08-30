<?php

namespace App\Actions\Money;

use App\Data\Money\MoneySelectionSnapshot;
use App\Data\Money\MoneySubscriptionPaymentData;
use App\Data\Money\MoneyTransactionData;
use App\Enums\MoneySubscriptionOccurrenceStatus;
use App\Enums\MoneyTransactionType;
use App\Models\MoneySubscription;
use App\Models\MoneySubscriptionOccurrence;
use App\Models\MoneyTransaction;
use App\Models\User;
use App\Services\Calendar\UserCalendar;
use App\Services\Money\MoneySubscriptionValidator;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PayMoneySubscriptionOccurrence
{
    public function __construct(
        private readonly MoneySubscriptionValidator $validator,
        private readonly SaveMoneyTransaction $saveTransaction,
        private readonly UserCalendar $calendar,
    ) {}

    public function execute(
        User $user,
        MoneySubscriptionOccurrence $occurrence,
        MoneySubscriptionPaymentData $data,
    ): MoneyTransaction {
        return DB::transaction(function () use ($user, $occurrence, $data): MoneyTransaction {
            $subscription = MoneySubscription::query()->lockForUpdate()->findOrFail($occurrence->subscription_id);
            $locked = MoneySubscriptionOccurrence::query()->lockForUpdate()->findOrFail($occurrence->id);
            $this->ensurePayable($user, $locked);
            $this->validator->validatePayment($user, $data, $locked);

            $transaction = $this->saveTransaction->createRetainingSelections(
                $user,
                new MoneyTransactionData(
                    type: MoneyTransactionType::Expense,
                    amountMinor: $data->amountMinor,
                    accountId: $data->accountId,
                    destinationAccountId: null,
                    categoryId: $data->categoryId,
                    subcategoryId: $data->subcategoryId,
                    date: CarbonImmutable::parse($locked->due_date),
                    note: $data->note,
                ),
                new MoneySelectionSnapshot(
                    accountId: $locked->account_id,
                    destinationAccountId: null,
                    categoryId: $locked->category_id,
                    subcategoryId: $locked->subcategory_id,
                ),
            );

            $locked->update([
                'amount_minor' => $data->amountMinor,
                'account_id' => $data->accountId,
                'category_id' => $data->categoryId,
                'subcategory_id' => $data->subcategoryId,
                'note' => $data->note,
                'status' => MoneySubscriptionOccurrenceStatus::Paid,
                'transaction_id' => $transaction->id,
                'paid_at' => now(),
                'skipped_at' => null,
                'automatic_retry_blocked_at' => null,
            ]);

            if ($data->applyToFuturePayments) {
                $this->applyToFuturePayments($subscription, $locked, $data);
            }

            return $transaction;
        }, 3);
    }

    private function ensurePayable(User $user, MoneySubscriptionOccurrence $occurrence): void
    {
        if ($occurrence->user_id !== $user->id) {
            throw ValidationException::withMessages(['occurrence' => 'This payment does not belong to you.']);
        }
        if ($occurrence->status !== MoneySubscriptionOccurrenceStatus::Due || $occurrence->transaction_id !== null) {
            throw ValidationException::withMessages(['occurrence' => 'This payment has already been resolved.']);
        }
        if ($occurrence->due_date->isAfter($this->calendar->today($user))) {
            throw ValidationException::withMessages(['occurrence' => 'Upcoming payments cannot be recorded before their due date.']);
        }
    }

    private function applyToFuturePayments(
        MoneySubscription $subscription,
        MoneySubscriptionOccurrence $occurrence,
        MoneySubscriptionPaymentData $data,
    ): void {
        $attributes = [
            'amount_minor' => $data->amountMinor,
            'account_id' => $data->accountId,
            'category_id' => $data->categoryId,
            'subcategory_id' => $data->subcategoryId,
            'note' => $data->note,
        ];
        $subscription->update($attributes);
        $subscription->occurrences()
            ->where('status', MoneySubscriptionOccurrenceStatus::Due)
            ->whereDate('due_date', '>', $occurrence->due_date)
            ->update($attributes);
    }
}
