<?php

namespace App\Support\Money;

use App\Enums\MoneySubscriptionRecurrence;
use App\Models\MoneySubscription;
use App\Models\MoneySubscriptionOccurrence;
use Carbon\CarbonImmutable;

class MoneySubscriptionViewDataFactory
{
    /** @return array<string, mixed> */
    public function subscription(MoneySubscription $subscription, CarbonImmutable $today): array
    {
        $next = $subscription->occurrences
            ->where('status', 'due')
            ->filter(fn (MoneySubscriptionOccurrence $occurrence): bool => ! $occurrence->due_date->isBefore($today))
            ->sortBy('due_date')
            ->first();

        return [
            'id' => $subscription->id,
            'name' => $subscription->name,
            'amountMinor' => $subscription->amount_minor,
            'currency' => $subscription->account->currency,
            'account' => $this->selection($subscription->account),
            'category' => $this->selection($subscription->category),
            'subcategory' => $subscription->subcategory ? $this->selection($subscription->subcategory) : null,
            'note' => $subscription->note,
            'startsOn' => $subscription->starts_on->toDateString(),
            'endsOn' => $subscription->ends_on?->toDateString(),
            'recurrence' => $subscription->recurrence->value,
            'scheduleSentence' => $this->scheduleSentence($subscription),
            'paymentMode' => $subscription->payment_mode->value,
            'status' => $subscription->status->value,
            'nextPayment' => $next?->due_date->toDateString(),
            'canDelete' => ! $subscription->occurrences->contains(
                fn (MoneySubscriptionOccurrence $occurrence): bool => $occurrence->status->value !== 'due' || ! $occurrence->due_date->isAfter($today),
            ),
            'occurrences' => $subscription->occurrences
                ->sortByDesc('due_date')
                ->map(fn (MoneySubscriptionOccurrence $occurrence) => $this->occurrence($occurrence, $today))
                ->values(),
        ];
    }

    /** @return array<string, mixed> */
    public function occurrence(MoneySubscriptionOccurrence $occurrence, CarbonImmutable $today): array
    {
        return [
            'id' => $occurrence->id,
            'subscriptionId' => $occurrence->subscription_id,
            'subscriptionName' => $occurrence->subscription->name,
            'paymentMode' => $occurrence->payment_mode->value,
            'dueDate' => $occurrence->due_date->toDateString(),
            'amountMinor' => $occurrence->amount_minor,
            'currency' => $occurrence->account->currency,
            'account' => $this->selection($occurrence->account),
            'category' => $this->selection($occurrence->category),
            'subcategory' => $occurrence->subcategory ? $this->selection($occurrence->subcategory) : null,
            'note' => $occurrence->note,
            'status' => $occurrence->status->value,
            'overdue' => $occurrence->status->value === 'due' && $occurrence->due_date->isBefore($today),
            'transactionId' => $occurrence->transaction_id,
            'paidAt' => $occurrence->paid_at?->toIso8601String(),
            'skippedAt' => $occurrence->skipped_at?->toIso8601String(),
            'automaticRetryBlockedAt' => $occurrence->automatic_retry_blocked_at?->toIso8601String(),
        ];
    }

    private function scheduleSentence(MoneySubscription $subscription): string
    {
        $date = $subscription->starts_on->format('F j');

        return match ($subscription->recurrence) {
            MoneySubscriptionRecurrence::Weekly => 'Every week on '.$subscription->starts_on->format('l'),
            MoneySubscriptionRecurrence::Monthly => 'Every month on day '.$subscription->anchor_day,
            MoneySubscriptionRecurrence::EveryThreeMonths => 'Every three months on day '.$subscription->anchor_day,
            MoneySubscriptionRecurrence::Yearly => 'Every year on '.$date,
        };
    }

    /** @return array{id: int, name: string, archived: bool} */
    private function selection(object $selection): array
    {
        return [
            'id' => $selection->id,
            'name' => $selection->name,
            'archived' => $selection->archived_at !== null,
        ];
    }
}
