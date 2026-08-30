<?php

namespace App\Http\Controllers;

use App\Actions\Money\PayMoneySubscriptionOccurrence;
use App\Actions\Money\SkipMoneySubscriptionOccurrence;
use App\Data\Money\MoneySubscriptionPaymentData;
use App\Http\Requests\PayMoneySubscriptionOccurrenceRequest;
use App\Models\MoneySubscriptionOccurrence;
use App\Support\Money\MoneyAmount;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class MoneySubscriptionOccurrenceController extends Controller
{
    public function pay(
        PayMoneySubscriptionOccurrenceRequest $request,
        MoneySubscriptionOccurrence $occurrence,
        PayMoneySubscriptionOccurrence $pay,
        MoneyAmount $amount,
    ): RedirectResponse {
        Gate::authorize('update', $occurrence);
        $validated = $request->validated();
        $pay->execute($request->user(), $occurrence, new MoneySubscriptionPaymentData(
            amountMinor: $amount->toMinorUnits($validated['amount']),
            accountId: (int) $validated['account_id'],
            categoryId: (int) $validated['category_id'],
            subcategoryId: isset($validated['subcategory_id']) ? (int) $validated['subcategory_id'] : null,
            note: $validated['note'] ?? null,
            applyToFuturePayments: (bool) $validated['apply_to_future'],
        ));

        return back();
    }

    public function skip(
        MoneySubscriptionOccurrence $occurrence,
        SkipMoneySubscriptionOccurrence $skip,
    ): RedirectResponse {
        Gate::authorize('update', $occurrence);
        $skip->execute(request()->user(), $occurrence);

        return back();
    }
}
