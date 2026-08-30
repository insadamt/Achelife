<?php

namespace App\Services\Money;

use App\Enums\MoneySubscriptionRecurrence;
use App\Models\MoneySubscription;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class MoneySubscriptionSchedule
{
    /** @return Collection<int, CarbonImmutable> */
    public function dueDatesThrough(MoneySubscription $subscription, CarbonImmutable $through): Collection
    {
        $dates = collect();
        $position = 0;

        while (true) {
            $dueDate = $this->dateAt($subscription, $position);
            if ($dueDate->isAfter($through) || ($subscription->ends_on !== null && $dueDate->isAfter($subscription->ends_on))) {
                break;
            }

            $dates->push($dueDate);
            $position++;
        }

        return $dates;
    }

    public function nextOnOrAfter(MoneySubscription $subscription, CarbonImmutable $date): ?CarbonImmutable
    {
        $position = 0;

        while (true) {
            $dueDate = $this->dateAt($subscription, $position++);
            if ($subscription->ends_on !== null && $dueDate->isAfter($subscription->ends_on)) {
                return null;
            }
            if (! $dueDate->isBefore($date)) {
                return $dueDate;
            }
        }
    }

    private function dateAt(MoneySubscription $subscription, int $position): CarbonImmutable
    {
        return match ($subscription->recurrence) {
            MoneySubscriptionRecurrence::Weekly => $subscription->starts_on->addWeeks($position),
            MoneySubscriptionRecurrence::Monthly => $this->monthDate($subscription, $position),
            MoneySubscriptionRecurrence::EveryThreeMonths => $this->monthDate($subscription, $position * 3),
            MoneySubscriptionRecurrence::Yearly => $this->yearDate($subscription, $position),
        };
    }

    private function monthDate(MoneySubscription $subscription, int $monthOffset): CarbonImmutable
    {
        $month = $subscription->starts_on->startOfMonth()->addMonths($monthOffset);

        return $month->day(min($subscription->anchor_day, $month->daysInMonth));
    }

    private function yearDate(MoneySubscription $subscription, int $yearOffset): CarbonImmutable
    {
        $month = $subscription->starts_on->startOfMonth()->addYears($yearOffset);

        return $month->day(min($subscription->anchor_day, $month->daysInMonth));
    }
}
