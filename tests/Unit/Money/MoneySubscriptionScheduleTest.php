<?php

namespace Tests\Unit\Money;

use App\Enums\MoneySubscriptionRecurrence;
use App\Models\MoneySubscription;
use App\Services\Money\MoneySubscriptionSchedule;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class MoneySubscriptionScheduleTest extends TestCase
{
    #[DataProvider('anchoredSchedules')]
    public function test_recurrence_keeps_its_original_calendar_anchor(
        string $startsOn,
        MoneySubscriptionRecurrence $recurrence,
        string $through,
        array $expected,
    ): void {
        $subscription = new MoneySubscription([
            'starts_on' => $startsOn,
            'ends_on' => null,
            'recurrence' => $recurrence,
            'anchor_day' => CarbonImmutable::parse($startsOn)->day,
        ]);

        $dates = app(MoneySubscriptionSchedule::class)
            ->dueDatesThrough($subscription, CarbonImmutable::parse($through))
            ->map->toDateString()
            ->all();

        $this->assertSame($expected, $dates);
    }

    public static function anchoredSchedules(): array
    {
        return [
            'monthly 31st returns after February' => [
                '2026-01-31', MoneySubscriptionRecurrence::Monthly, '2026-04-30',
                ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30'],
            ],
            'quarterly month ends' => [
                '2025-11-30', MoneySubscriptionRecurrence::EveryThreeMonths, '2026-08-31',
                ['2025-11-30', '2026-02-28', '2026-05-30', '2026-08-30'],
            ],
            'yearly leap day' => [
                '2024-02-29', MoneySubscriptionRecurrence::Yearly, '2028-02-29',
                ['2024-02-29', '2025-02-28', '2026-02-28', '2027-02-28', '2028-02-29'],
            ],
            'weekly' => [
                '2026-08-01', MoneySubscriptionRecurrence::Weekly, '2026-08-22',
                ['2026-08-01', '2026-08-08', '2026-08-15', '2026-08-22'],
            ],
        ];
    }
}
