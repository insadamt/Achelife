<?php

namespace App\Actions\Money;

use App\Data\Money\MoneySubscriptionData;
use App\Enums\MoneySubscriptionStatus;
use App\Models\MoneyAccount;
use App\Models\MoneyCategory;
use App\Models\MoneySubcategory;
use App\Models\MoneySubscription;
use App\Models\User;
use App\Services\Calendar\UserCalendar;
use App\Services\Money\MoneySubscriptionValidator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SaveMoneySubscription
{
    public function __construct(
        private readonly MoneySubscriptionValidator $validator,
        private readonly SynchronizeMoneySubscriptions $synchronize,
        private readonly UserCalendar $calendar,
    ) {}

    public function create(User $user, MoneySubscriptionData $data): MoneySubscription
    {
        $subscription = DB::transaction(function () use ($user, $data): MoneySubscription {
            $this->lockSelections($user, $data);
            $this->validator->validateDefinition($user, $data);

            return $user->moneySubscriptions()->create([
                ...$this->attributes($data),
                'materialize_from' => $data->startsOn,
                'status' => MoneySubscriptionStatus::Active,
                'anchor_day' => $data->startsOn->day,
            ]);
        }, 3);

        $this->synchronize->execute($user);

        return $subscription->refresh();
    }

    public function update(User $user, MoneySubscription $subscription, MoneySubscriptionData $data): MoneySubscription
    {
        $today = $this->calendar->today($user);
        $updated = DB::transaction(function () use ($user, $subscription, $data, $today): MoneySubscription {
            $locked = MoneySubscription::query()->lockForUpdate()->findOrFail($subscription->id);
            $this->ensureOwnedAndEditable($user, $locked);
            $this->lockSelections($user, $data);
            $this->validator->validateDefinition($user, $data, $locked);

            $locked->occurrences()->where('status', 'due')->whereDate('due_date', '>', $today)->delete();
            $scheduleChanged = ! $locked->starts_on->isSameDay($data->startsOn)
                || $locked->recurrence !== $data->recurrence;
            $locked->update([
                ...$this->attributes($data),
                'anchor_day' => $data->startsOn->day,
                'materialize_from' => $scheduleChanged ? $today->max($data->startsOn) : $locked->materialize_from,
            ]);

            return $locked->refresh();
        }, 3);

        $this->synchronize->execute($user);

        return $updated->refresh();
    }

    private function ensureOwnedAndEditable(User $user, MoneySubscription $subscription): void
    {
        if ($subscription->user_id !== $user->id) {
            throw ValidationException::withMessages(['subscription' => 'This Subscription does not belong to you.']);
        }
        if ($subscription->status === MoneySubscriptionStatus::Ended) {
            throw ValidationException::withMessages(['subscription' => 'Ended Subscriptions cannot be edited.']);
        }
    }

    private function lockSelections(User $user, MoneySubscriptionData $data): void
    {
        MoneyAccount::query()->where('user_id', $user->id)->whereKey($data->accountId)->lockForUpdate()->get();
        MoneyCategory::query()->where('user_id', $user->id)->whereKey($data->categoryId)->lockForUpdate()->get();
        if ($data->subcategoryId !== null) {
            MoneySubcategory::query()->where('user_id', $user->id)->whereKey($data->subcategoryId)->lockForUpdate()->get();
        }
    }

    /** @return array<string, mixed> */
    private function attributes(MoneySubscriptionData $data): array
    {
        return [
            'name' => $data->name,
            'amount_minor' => $data->amountMinor,
            'account_id' => $data->accountId,
            'category_id' => $data->categoryId,
            'subcategory_id' => $data->subcategoryId,
            'note' => $data->note,
            'starts_on' => $data->startsOn,
            'ends_on' => $data->endsOn,
            'recurrence' => $data->recurrence,
            'payment_mode' => $data->paymentMode,
        ];
    }
}
