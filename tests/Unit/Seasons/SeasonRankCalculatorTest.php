<?php

namespace Tests\Unit\Seasons;

use App\Services\Seasons\SeasonRankCalculator;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class SeasonRankCalculatorTest extends TestCase
{
    /** @return array<string, array{int, string}> */
    public static function thresholdCases(): array
    {
        return [
            'below zero' => [-1, 'unranked'],
            'bronze one start' => [0, 'bronze_i'],
            'bronze one end' => [99, 'bronze_i'],
            'bronze two start' => [100, 'bronze_ii'],
            'bronze two end' => [199, 'bronze_ii'],
            'bronze three start' => [200, 'bronze_iii'],
            'bronze three end' => [299, 'bronze_iii'],
            'silver one start' => [300, 'silver_i'],
            'silver one end' => [399, 'silver_i'],
            'silver two start' => [400, 'silver_ii'],
            'silver two end' => [499, 'silver_ii'],
            'silver three start' => [500, 'silver_iii'],
            'silver three end' => [599, 'silver_iii'],
            'gold one start' => [600, 'gold_i'],
            'gold one end' => [699, 'gold_i'],
            'gold two start' => [700, 'gold_ii'],
            'gold two end' => [799, 'gold_ii'],
            'gold three start' => [800, 'gold_iii'],
            'gold three end' => [899, 'gold_iii'],
            'platinum one start' => [900, 'platinum_i'],
            'platinum one end' => [999, 'platinum_i'],
            'platinum two start' => [1000, 'platinum_ii'],
            'platinum two end' => [1099, 'platinum_ii'],
            'platinum three start' => [1100, 'platinum_iii'],
            'platinum three end' => [1199, 'platinum_iii'],
            'diamond one start' => [1200, 'diamond_i'],
            'diamond one end' => [1299, 'diamond_i'],
            'diamond two start' => [1300, 'diamond_ii'],
            'diamond two end' => [1399, 'diamond_ii'],
            'diamond three start' => [1400, 'diamond_iii'],
            'diamond three end' => [1499, 'diamond_iii'],
            'master one start' => [1500, 'master_i'],
            'master one end' => [1599, 'master_i'],
            'master two start' => [1600, 'master_ii'],
            'master two end' => [1699, 'master_ii'],
            'master three start' => [1700, 'master_iii'],
            'master three end' => [1799, 'master_iii'],
            'grandmaster one start' => [1800, 'grandmaster_i'],
            'grandmaster one end' => [1899, 'grandmaster_i'],
            'grandmaster two start' => [1900, 'grandmaster_ii'],
            'grandmaster two end' => [1999, 'grandmaster_ii'],
            'grandmaster three start' => [2000, 'grandmaster_iii'],
            'grandmaster three end' => [2099, 'grandmaster_iii'],
            'legend start' => [2100, 'legend'],
            'legend has no ceiling' => [1_000_000, 'legend'],
        ];
    }

    #[DataProvider('thresholdCases')]
    public function test_rank_threshold_boundaries(int $seasonPoints, string $expectedKey): void
    {
        $this->assertSame($expectedKey, (new SeasonRankCalculator)->calculate($seasonPoints)->key);
    }

    public function test_divisions_advance_from_one_to_three_before_the_next_tier(): void
    {
        $calculator = new SeasonRankCalculator;

        $this->assertSame(
            ['BRONZE I', 'BRONZE II', 'BRONZE III', 'SILVER I'],
            array_map(
                fn (int $points): string => $calculator->calculate($points)->displayName,
                [0, 100, 200, 300],
            ),
        );
    }

    public function test_normal_division_progress_uses_the_actual_next_rank(): void
    {
        $calculator = new SeasonRankCalculator;
        $platinumTwo = $calculator->calculate(1042);
        $platinumThree = $calculator->calculate(1190);

        $this->assertSame('PLATINUM II', $platinumTwo->displayName);
        $this->assertSame(42, $platinumTwo->progressCurrent);
        $this->assertSame(100, $platinumTwo->progressRequired);
        $this->assertSame(42, $platinumTwo->progressPercent);
        $this->assertSame(58, $platinumTwo->spToNext);
        $this->assertSame('PLATINUM III', $platinumTwo->nextRank);

        $this->assertSame('PLATINUM III', $platinumThree->displayName);
        $this->assertSame(90, $platinumThree->progressCurrent);
        $this->assertSame(10, $platinumThree->spToNext);
        $this->assertSame('DIAMOND I', $platinumThree->nextRank);
    }

    /** @return array<string, array{int}> */
    public static function negativeSeasonPointCases(): array
    {
        return ['minus one' => [-1], 'minus fifty' => [-50], 'minus five hundred' => [-500]];
    }

    #[DataProvider('negativeSeasonPointCases')]
    public function test_negative_sp_is_unranked_without_artificial_percentage_progress(int $seasonPoints): void
    {
        $rank = (new SeasonRankCalculator)->calculate($seasonPoints);

        $this->assertSame('unranked', $rank->key);
        $this->assertSame($seasonPoints, -$rank->spToNext);
        $this->assertSame('BRONZE I', $rank->nextRank);
        $this->assertNull($rank->progressCurrent);
        $this->assertNull($rank->progressRequired);
        $this->assertNull($rank->progressPercent);
    }

    public function test_legend_has_no_fake_next_rank_progress(): void
    {
        $rank = (new SeasonRankCalculator)->calculate(2480);

        $this->assertTrue($rank->topRank);
        $this->assertNull($rank->nextRank);
        $this->assertNull($rank->spToNext);
        $this->assertNull($rank->progressCurrent);
    }
}
