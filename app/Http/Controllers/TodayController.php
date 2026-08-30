<?php

namespace App\Http\Controllers;

use App\Actions\Money\SynchronizeMoneySubscriptions;
use App\Actions\Seasons\ResolveUserSeasonCycle;
use App\Enums\MoneySubscriptionOccurrenceStatus;
use App\Models\MoneySubscriptionOccurrence;
use App\Services\Calendar\UserCalendar;
use App\Support\Money\MoneySubscriptionViewDataFactory;
use App\Support\Seasons\SeasonCloseoutViewDataFactory;
use App\Support\Seasons\SeasonCycleViewDataFactory;
use App\Support\Seasons\SeasonViewDataFactory;
use App\Support\Today\TodayViewDataFactory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TodayController extends Controller
{
    public function __invoke(
        Request $request,
        TodayViewDataFactory $viewDataFactory,
        ResolveUserSeasonCycle $resolveUserSeasonCycle,
        SeasonCycleViewDataFactory $cycleViewDataFactory,
        SeasonViewDataFactory $seasonViewDataFactory,
        UserCalendar $calendar,
        SynchronizeMoneySubscriptions $synchronizeMoneySubscriptions,
        MoneySubscriptionViewDataFactory $subscriptionViewDataFactory,
        SeasonCloseoutViewDataFactory $closeoutViewDataFactory,
    ): Response {
        $user = $request->user();
        $today = $calendar->today($user);
        $synchronizeMoneySubscriptions->execute($user, $today);
        $manualPayments = $user->moneySubscriptionOccurrences()
            ->where('status', MoneySubscriptionOccurrenceStatus::Due)
            ->whereDate('due_date', '<=', $today)
            ->where('payment_mode', 'manual')
            ->with(['subscription', 'account', 'category', 'subcategory'])
            ->orderBy('due_date')
            ->get()
            ->map(fn (MoneySubscriptionOccurrence $occurrence) => $subscriptionViewDataFactory->occurrence($occurrence, $today));
        $cycle = $resolveUserSeasonCycle->execute($user, $today);

        if ($cycle->activeSeason === null) {
            return Inertia::render('Intermission', [
                'cycle' => $cycleViewDataFactory->make($cycle, $today),
                'lastSeason' => $seasonViewDataFactory->forSeason($cycle->latestSeason->load('objectives'), $today),
                'closeout' => $closeoutViewDataFactory->make($cycle->latestSeason),
                'manualSubscriptionPayments' => $manualPayments,
            ]);
        }

        return Inertia::render('Home', [
            ...$viewDataFactory->make($user, $today),
            'manualSubscriptionPayments' => $manualPayments,
        ]);
    }
}
