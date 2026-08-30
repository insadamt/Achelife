<?php

namespace App\Http\Controllers;

use App\Enums\MoneyCategoryType;
use App\Enums\MoneySubscriptionOccurrenceStatus;
use App\Enums\MoneySubscriptionStatus;
use App\Models\MoneyCategory;
use App\Models\MoneySubscription;
use App\Models\MoneySubscriptionOccurrence;
use App\Services\Calendar\UserCalendar;
use App\Support\Money\MoneySubscriptionViewDataFactory;
use App\Support\Money\MoneyViewDataFactory;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MoneySubscriptionPageController extends Controller
{
    public function __invoke(
        Request $request,
        UserCalendar $calendar,
        MoneySubscriptionViewDataFactory $subscriptionFactory,
        MoneyViewDataFactory $moneyFactory,
    ): Response {
        $view = $request->validate(['view' => ['nullable', Rule::in(['active', 'due', 'paused', 'ended'])]])['view'] ?? 'active';
        $user = $request->user();
        $today = $calendar->today($user);
        $subscriptions = $user->moneySubscriptions()
            ->with(['account', 'category', 'subcategory', 'occurrences' => fn ($query) => $query
                ->with(['subscription', 'account', 'category', 'subcategory'])
                ->orderByDesc('due_date')
                ->limit(24)])
            ->withCount('occurrences')
            ->when($view !== 'due', fn ($query) => $query->where('status', MoneySubscriptionStatus::from($view)))
            ->orderBy('name')
            ->get();
        $dueOccurrences = $user->moneySubscriptionOccurrences()
            ->where('status', MoneySubscriptionOccurrenceStatus::Due)
            ->whereDate('due_date', '<=', $today)
            ->with(['subscription', 'account', 'category', 'subcategory'])
            ->orderBy('due_date')
            ->get();

        return Inertia::render('money/subscriptions/Index', [
            'today' => $today->toDateString(),
            'view' => $view,
            'subscriptions' => $subscriptions->map(fn (MoneySubscription $subscription) => $subscriptionFactory->subscription($subscription, $today)),
            'dueOccurrences' => $dueOccurrences->map(fn (MoneySubscriptionOccurrence $occurrence) => $subscriptionFactory->occurrence($occurrence, $today)),
            'counts' => [
                'active' => $user->moneySubscriptions()->where('status', MoneySubscriptionStatus::Active)->count(),
                'due' => $dueOccurrences->count(),
                'paused' => $user->moneySubscriptions()->where('status', MoneySubscriptionStatus::Paused)->count(),
                'ended' => $user->moneySubscriptions()->where('status', MoneySubscriptionStatus::Ended)->count(),
            ],
            'accounts' => $user->moneyAccounts()->orderBy('name')->get()->map(
                fn ($account) => $moneyFactory->account($account, 0),
            ),
            'categories' => $user->moneyCategories()
                ->where('type', MoneyCategoryType::Expense)
                ->with(['subcategories' => fn ($query) => $query->orderBy('name')])
                ->withCount('transactions')
                ->orderBy('name')
                ->get()
                ->map(fn (MoneyCategory $category) => $moneyFactory->category($category)),
        ]);
    }
}
