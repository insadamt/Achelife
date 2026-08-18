<?php

namespace Tests\Unit\Constitution;

use App\Enums\LawSeverity;
use App\Services\Constitution\ConstitutionPenaltyCalculator;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class ConstitutionPenaltyCalculatorTest extends TestCase
{
    /** @return array<string, array{LawSeverity, int, int}> */
    public static function penalties(): array
    {
        return [
            'minor first' => [LawSeverity::Minor, 1, -10],
            'minor third' => [LawSeverity::Minor, 3, -30],
            'major second' => [LawSeverity::Major, 2, -100],
            'major fourth' => [LawSeverity::Major, 4, -200],
            'critical first' => [LawSeverity::Critical, 1, -100],
            'critical third' => [LawSeverity::Critical, 3, -300],
        ];
    }

    #[DataProvider('penalties')]
    public function test_fixed_severity_penalties_scale_by_sequence(
        LawSeverity $severity,
        int $sequence,
        int $expectedPenalty,
    ): void {
        $this->assertSame(
            $expectedPenalty,
            (new ConstitutionPenaltyCalculator)->calculate($severity->basePenalty(), $sequence),
        );
    }

    public function test_invalid_snapshot_or_sequence_is_rejected(): void
    {
        $calculator = new ConstitutionPenaltyCalculator;

        foreach ([fn () => $calculator->calculate(-25, 1), fn () => $calculator->calculate(-10, 0)] as $invalidCalculation) {
            try {
                $invalidCalculation();
                $this->fail('Invalid Constitution penalty data must be rejected.');
            } catch (InvalidArgumentException) {
                $this->addToAssertionCount(1);
            }
        }
    }
}
