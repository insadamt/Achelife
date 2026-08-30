<?php

namespace App\Http\Controllers;

use App\Enums\MoneySubscriptionOccurrenceStatus;
use App\Models\MoneyAccount;
use App\Models\MoneyCategory;
use App\Models\MoneySubscriptionOccurrence;
use App\Models\MoneyTransaction;
use App\Models\User;
use App\Services\Calendar\UserCalendar;
use App\Services\Money\AccountBalanceCalculator;
use App\Support\Money\MoneySubscriptionViewDataFactory;
use App\Support\Money\MoneyViewDataFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class MoneyController extends Controller
{
    public function index(
        Request $request,
        AccountBalanceCalculator $balanceCalculator,
        MoneyViewDataFactory $viewDataFactory,
        UserCalendar $calendar,
        MoneySubscriptionViewDataFactory $subscriptionFactory,
    ): Response {
        $user = $request->user();
        $accounts = $user->moneyAccounts()
            ->whereNull('archived_at')
            ->withCount(['transactions', 'incomingTransfers'])
            ->orderBy('created_at')
            ->get();
        $balances = $balanceCalculator->forAccounts($user, $accounts);

        $today = $calendar->today($user);
        $subscriptionOccurrences = $user->moneySubscriptionOccurrences()
            ->where('status', MoneySubscriptionOccurrenceStatus::Due)
            ->with(['subscription', 'account', 'category', 'subcategory'])
            ->orderBy('due_date')
            ->get();

        return Inertia::render('money/Index', [
            'today' => $today->toDateString(),
            'accounts' => $accounts->map(fn (MoneyAccount $account) => $viewDataFactory->account($account, $balances[$account->id])),
            'totalsByCurrency' => $balanceCalculator->totalsByCurrency($accounts, $balances),
            'categories' => $this->categories($user, $viewDataFactory),
            'recentTransactions' => $this->transactions($user)->limit(8)->get()->map(
                fn (MoneyTransaction $transaction) => $viewDataFactory->transaction($transaction),
            ),
            'dueSubscriptions' => $subscriptionOccurrences->filter(fn (MoneySubscriptionOccurrence $occurrence): bool => ! $occurrence->due_date->isAfter($today))->map(
                fn (MoneySubscriptionOccurrence $occurrence) => $subscriptionFactory->occurrence($occurrence, $today),
            )->values(),
            'upcomingSubscriptions' => $subscriptionOccurrences->filter(fn (MoneySubscriptionOccurrence $occurrence): bool => $occurrence->due_date->isAfter($today))->take(5)->map(
                fn (MoneySubscriptionOccurrence $occurrence) => $subscriptionFactory->occurrence($occurrence, $today),
            )->values(),
        ]);
    }

    /** @return Collection<int, array<string, mixed>> */
    private function categories(User $user, MoneyViewDataFactory $viewDataFactory): Collection
    {
        return $user->moneyCategories()
            ->with(['subcategories' => fn ($query) => $query->orderBy('name')])
            ->withCount('transactions')
            ->orderBy('type')
            ->orderBy('name')
            ->get()
            ->map(fn (MoneyCategory $category) => $viewDataFactory->category($category));
    }

    /** @return HasMany<MoneyTransaction, User> */
    private function transactions(User $user): HasMany
    {
        return $user->moneyTransactions()
            ->with(['account', 'destinationAccount', 'category', 'subcategory', 'subscriptionOccurrence.subscription'])
            ->orderByDesc('transaction_date')
            ->orderByDesc('created_at')
            ->orderByDesc('id');
    }
}
