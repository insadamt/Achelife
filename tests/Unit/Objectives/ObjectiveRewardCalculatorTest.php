<?php

namespace Tests\Unit\Objectives;

use App\Services\Objectives\ObjectiveRewardCalculator;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class ObjectiveRewardCalculatorTest extends TestCase
{
    /** @return array<string, array{int, int}> */
    public static function distributions(): array
    {
        return [
            'none' => [0, 0],
            'one' => [1, 300],
            'two' => [2, 150],
            'three' => [3, 100],
        ];
    }

    #[DataProvider('distributions')]
    public function test_reward_distribution_is_centralized(int $count, int $expectedReward): void
    {
        $reward = (new ObjectiveRewardCalculator)->rewardPerObjective($count);

        $this->assertSame($expectedReward, $reward);
        $this->assertLessThanOrEqual(300, $reward * $count);
    }

    public function test_more_than_three_objectives_is_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);

        (new ObjectiveRewardCalculator)->rewardPerObjective(4);
    }
}
