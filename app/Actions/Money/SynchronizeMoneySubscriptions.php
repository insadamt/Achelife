<?php

namespace App\Actions\Money;

use App\Data\Money\MoneySubscriptionPaymentData;
use App\Enums\MoneySubscriptionOccurrenceStatus;
use App\Enums\MoneySubscriptionPaymentMode;
use App\Enums\MoneySubscriptionStatus;
use App\Models\MoneySubscription;
use App\Models\MoneySubscriptionOccurrence;
use App\Models\User;
use App\Services\Calendar\UserCalendar;
use App\Services\Money\MoneySubscriptionSchedule;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class SynchronizeMoneySubscriptions
{
    public function __construct(
        private readonly MoneySubscriptionSchedule $schedule,
        private readonly PayMoneySubscriptionOccurrence $pay,
        private readonly UserCalendar $calendar,
    ) {}

    public function execute(User $user, ?CarbonImmutable $today = null, ?CarbonImmutable $notBefore = null): void
    {
        $localToday = $today ?? $this->calendar->today($user);
        $user->moneySubscriptions()->whereIn('status', [MoneySubscriptionStatus::Active, MoneySubscriptionStatus::Paused])->pluck('id')
            ->each(fn (int $subscriptionId) => $this->synchronizeOne($user, $subscriptionId, $localToday, $notBefore));
    }

    private function synchronizeOne(User $user, int $subscriptionId, CarbonImmutable $today, ?CarbonImmutable $notBefore): void
    {
        DB::transaction(function () use ($user, $subscriptionId, $today, $notBefore): void {
            $subscription = MoneySubscription::query()->lockForUpdate()->findOrFail($subscriptionId);
            if ($subscription->user_id !== $user->id) {
                return;
            }
            if ($subscription->status === MoneySubscriptionStatus::Paused) {
                if ($subscription->ends_on !== null && $subscription->ends_on->isBefore($today)) {
                    $subscription->update(['status' => MoneySubscriptionStatus::Ended, 'ended_at' => now()]);
                }

                return;
            }
            if ($subscription->status !== MoneySubscriptionStatus::Active) {
                return;
            }

            $this->materializeThrough($subscription, $today, $notBefore);
            $this->materializeNext($subscription, $today);

            if ($subscription->payment_mode === MoneySubscriptionPaymentMode::Automatic) {
                $this->payDueOccurrences($user, $subscription, $today, $notBefore);
            }

            if ($subscription->ends_on !== null && $subscription->ends_on->isBefore($today)) {
                $subscription->update(['status' => MoneySubscriptionStatus::Ended, 'ended_at' => now()]);
            }
        }, 3);
    }

    private function materializeThrough(MoneySubscription $subscription, CarbonImmutable $today, ?CarbonImmutable $notBefore): void
    {
        $this->schedule->dueDatesThrough($subscription, $today)
            ->filter(fn (CarbonImmutable $dueDate): bool => ! $dueDate->isBefore($subscription->materialize_from)
                && ($notBefore === null || ! $dueDate->isBefore($notBefore)))
            ->each(fn (CarbonImmutable $dueDate) => $this->materialize($subscription, $dueDate));
    }

    private function materializeNext(MoneySubscription $subscription, CarbonImmutable $today): void
    {
        $next = $this->schedule->nextOnOrAfter($subscription, $today->addDay()->max($subscription->materialize_from));
        if ($next !== null) {
            $this->materialize($subscription, $next);
        }
    }

    private function materialize(MoneySubscription $subscription, CarbonImmutable $dueDate): void
    {
        $exists = MoneySubscriptionOccurrence::query()
            ->where('subscription_id', $subscription->id)
            ->whereDate('due_date', $dueDate)
            ->exists();
        if ($exists) {
            return;
        }

        MoneySubscriptionOccurrence::query()->create([
            'subscription_id' => $subscription->id,
            'due_date' => $dueDate,
            'user_id' => $subscription->user_id,
            'amount_minor' => $subscription->amount_minor,
            'account_id' => $subscription->account_id,
            'category_id' => $subscription->category_id,
            'subcategory_id' => $subscription->subcategory_id,
            'note' => $subscription->note,
            'payment_mode' => $subscription->payment_mode,
            'status' => MoneySubscriptionOccurrenceStatus::Due,
        ]);
    }

    private function payDueOccurrences(User $user, MoneySubscription $subscription, CarbonImmutable $today, ?CarbonImmutable $notBefore): void
    {
        $occurrences = $subscription->occurrences()
            ->where('status', MoneySubscriptionOccurrenceStatus::Due)
            ->where('payment_mode', MoneySubscriptionPaymentMode::Automatic)
            ->whereNull('automatic_retry_blocked_at')
            ->whereDate('due_date', '<=', $today);

        if ($notBefore !== null) {
            $occurrences->whereDate('due_date', '>=', $notBefore);
        }

        $occurrences->orderBy('due_date')
            ->get()
            ->each(function (MoneySubscriptionOccurrence $occurrence) use ($user): void {
                $this->pay->execute($user, $occurrence, new MoneySubscriptionPaymentData(
                    amountMinor: $occurrence->amount_minor,
                    accountId: $occurrence->account_id,
                    categoryId: $occurrence->category_id,
                    subcategoryId: $occurrence->subcategory_id,
                    note: $occurrence->note,
                    applyToFuturePayments: false,
                ));
            });
    }
}
