<?php

namespace App\Http\Controllers;

use App\Actions\Money\ChangeMoneySubscriptionLifecycle;
use App\Actions\Money\SaveMoneySubscription;
use App\Data\Money\MoneySubscriptionData;
use App\Enums\MoneySubscriptionPaymentMode;
use App\Enums\MoneySubscriptionRecurrence;
use App\Http\Requests\StoreMoneySubscriptionRequest;
use App\Http\Requests\UpdateMoneySubscriptionRequest;
use App\Models\MoneySubscription;
use App\Support\Money\MoneyAmount;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class MoneySubscriptionController extends Controller
{
    public function store(
        StoreMoneySubscriptionRequest $request,
        SaveMoneySubscription $save,
        MoneyAmount $amount,
    ): RedirectResponse {
        $save->create($request->user(), $this->data($request->validated(), $amount));

        return back();
    }

    public function update(
        UpdateMoneySubscriptionRequest $request,
        MoneySubscription $subscription,
        SaveMoneySubscription $save,
        MoneyAmount $amount,
    ): RedirectResponse {
        Gate::authorize('update', $subscription);
        $save->update($request->user(), $subscription, $this->data($request->validated(), $amount));

        return back();
    }

    public function pause(MoneySubscription $subscription, ChangeMoneySubscriptionLifecycle $lifecycle): RedirectResponse
    {
        Gate::authorize('update', $subscription);
        $lifecycle->pause(request()->user(), $subscription);

        return back();
    }

    public function resume(MoneySubscription $subscription, ChangeMoneySubscriptionLifecycle $lifecycle): RedirectResponse
    {
        Gate::authorize('update', $subscription);
        $lifecycle->resume(request()->user(), $subscription);

        return back();
    }

    public function end(MoneySubscription $subscription, ChangeMoneySubscriptionLifecycle $lifecycle): RedirectResponse
    {
        Gate::authorize('update', $subscription);
        $lifecycle->end(request()->user(), $subscription);

        return back();
    }

    public function destroy(MoneySubscription $subscription, ChangeMoneySubscriptionLifecycle $lifecycle): RedirectResponse
    {
        Gate::authorize('delete', $subscription);
        $lifecycle->deleteUnused(request()->user(), $subscription);

        return back();
    }

    /** @param array<string, mixed> $validated */
    private function data(array $validated, MoneyAmount $amount): MoneySubscriptionData
    {
        return new MoneySubscriptionData(
            name: $validated['name'],
            amountMinor: $amount->toMinorUnits($validated['amount']),
            accountId: (int) $validated['account_id'],
            categoryId: (int) $validated['category_id'],
            subcategoryId: isset($validated['subcategory_id']) ? (int) $validated['subcategory_id'] : null,
            note: $validated['note'] ?? null,
            startsOn: CarbonImmutable::parse($validated['start_date']),
            endsOn: isset($validated['end_date']) ? CarbonImmutable::parse($validated['end_date']) : null,
            recurrence: MoneySubscriptionRecurrence::from($validated['recurrence']),
            paymentMode: MoneySubscriptionPaymentMode::from($validated['payment_mode']),
        );
    }
}
