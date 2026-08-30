<?php

namespace App\Actions\Money;

use App\Enums\MoneySubscriptionOccurrenceStatus;
use App\Enums\MoneySubscriptionStatus;
use App\Models\MoneySubscription;
use App\Models\User;
use App\Services\Calendar\UserCalendar;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ChangeMoneySubscriptionLifecycle
{
    public function __construct(
        private readonly UserCalendar $calendar,
        private readonly SynchronizeMoneySubscriptions $synchronize,
    ) {}

    public function pause(User $user, MoneySubscription $subscription): void
    {
        $today = $this->calendar->today($user);
        $this->change($user, $subscription, function (MoneySubscription $locked) use ($today): void {
            if ($locked->status !== MoneySubscriptionStatus::Active) {
                throw ValidationException::withMessages(['subscription' => 'Only active Subscriptions can be paused.']);
            }
            $locked->occurrences()
                ->where('status', MoneySubscriptionOccurrenceStatus::Due)
                ->whereDate('due_date', '>', $today)
                ->delete();
            $locked->update(['status' => MoneySubscriptionStatus::Paused, 'paused_at' => now()]);
        });
    }

    public function resume(User $user, MoneySubscription $subscription): void
    {
        $today = $this->calendar->today($user);
        $this->change($user, $subscription, function (MoneySubscription $locked) use ($today): void {
            if ($locked->status !== MoneySubscriptionStatus::Paused) {
                throw ValidationException::withMessages(['subscription' => 'Only paused Subscriptions can be resumed.']);
            }
            $locked->update([
                'status' => MoneySubscriptionStatus::Active,
                'materialize_from' => $today,
                'paused_at' => null,
            ]);
        });
        $this->synchronize->execute($user, $today);
    }

    public function end(User $user, MoneySubscription $subscription): void
    {
        $today = $this->calendar->today($user);
        $this->change($user, $subscription, function (MoneySubscription $locked) use ($today): void {
            if ($locked->status === MoneySubscriptionStatus::Ended) {
                return;
            }
            $locked->occurrences()
                ->where('status', MoneySubscriptionOccurrenceStatus::Due)
                ->whereDate('due_date', '>', $today)
                ->delete();
            $locked->update([
                'status' => MoneySubscriptionStatus::Ended,
                'ends_on' => $locked->ends_on?->min($today) ?? $today,
                'ended_at' => now(),
                'paused_at' => null,
            ]);
        });
    }

    public function deleteUnused(User $user, MoneySubscription $subscription): void
    {
        $today = $this->calendar->today($user);
        $this->change($user, $subscription, function (MoneySubscription $locked) use ($today): void {
            $hasHistory = $locked->occurrences()
                ->where(function ($query) use ($today): void {
                    $query->where('status', '!=', MoneySubscriptionOccurrenceStatus::Due)
                        ->orWhereDate('due_date', '<=', $today);
                })
                ->exists();
            if ($hasHistory) {
                throw ValidationException::withMessages(['subscription' => 'Subscriptions with occurrence history must be ended instead of deleted.']);
            }
            $locked->delete();
        });
    }

    private function change(User $user, MoneySubscription $subscription, callable $change): void
    {
        DB::transaction(function () use ($user, $subscription, $change): void {
            $locked = MoneySubscription::query()->lockForUpdate()->findOrFail($subscription->id);
            if ($locked->user_id !== $user->id) {
                throw ValidationException::withMessages(['subscription' => 'This Subscription does not belong to you.']);
            }
            $change($locked);
        }, 3);
    }
}
