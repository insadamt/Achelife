<?php

namespace App\Actions\Money;

use App\Enums\MoneySubscriptionOccurrenceStatus;
use App\Models\MoneySubscriptionOccurrence;
use App\Models\User;
use App\Services\Calendar\UserCalendar;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SkipMoneySubscriptionOccurrence
{
    public function __construct(private readonly UserCalendar $calendar) {}

    public function execute(User $user, MoneySubscriptionOccurrence $occurrence): void
    {
        DB::transaction(function () use ($user, $occurrence): void {
            $locked = MoneySubscriptionOccurrence::query()->lockForUpdate()->findOrFail($occurrence->id);
            if ($locked->user_id !== $user->id) {
                throw ValidationException::withMessages(['occurrence' => 'This payment does not belong to you.']);
            }
            if ($locked->status !== MoneySubscriptionOccurrenceStatus::Due || $locked->transaction_id !== null) {
                throw ValidationException::withMessages(['occurrence' => 'This payment has already been resolved.']);
            }
            if ($locked->due_date->isAfter($this->calendar->today($user))) {
                throw ValidationException::withMessages(['occurrence' => 'Upcoming payments cannot be skipped before their due date.']);
            }

            $locked->update([
                'status' => MoneySubscriptionOccurrenceStatus::Skipped,
                'skipped_at' => now(),
                'paid_at' => null,
                'transaction_id' => null,
            ]);
        }, 3);
    }
}
