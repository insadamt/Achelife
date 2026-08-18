<?php

namespace Tests\Unit\Tasks;

use App\Enums\TaskCompletionTiming;
use App\Services\Tasks\TaskRewardCalculator;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class TaskRewardCalculatorTest extends TestCase
{
    /** @return array<string, array{bool, string, int, TaskCompletionTiming}> */
    public static function rewardCases(): array
    {
        return [
            'important and future' => [true, '2026-08-20', 16, TaskCompletionTiming::Early],
            'important and due today' => [true, '2026-08-18', 8, TaskCompletionTiming::OnTime],
            'important and late' => [true, '2026-08-17', 4, TaskCompletionTiming::Late],
            'not important and future' => [false, '2026-08-20', 2, TaskCompletionTiming::Early],
            'not important and due today' => [false, '2026-08-18', 4, TaskCompletionTiming::OnTime],
            'not important and late' => [false, '2026-08-17', 2, TaskCompletionTiming::Late],
        ];
    }

    #[DataProvider('rewardCases')]
    public function test_eisenhower_reward_is_calculated_at_completion(
        bool $important,
        string $scheduledDate,
        int $expectedPoints,
        TaskCompletionTiming $expectedTiming,
    ): void {
        $reward = (new TaskRewardCalculator)->calculate(
            $important,
            CarbonImmutable::parse($scheduledDate),
            CarbonImmutable::parse('2026-08-18'),
        );

        $this->assertSame($expectedPoints, $reward->points);
        $this->assertSame($expectedTiming, $reward->timing);
    }
}
