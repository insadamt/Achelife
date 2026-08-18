<?php

namespace App\Services\Seasons;

use App\Data\Seasons\SeasonRank;
use InvalidArgumentException;

class SeasonRankCalculator
{
    /**
     * @var list<array{key: string, name: string, tier: string, division: string|null, minimum_sp: int}>
     */
    private const RANKS = [
        ['key' => 'bronze_i', 'name' => 'BRONZE', 'tier' => 'bronze', 'division' => 'I', 'minimum_sp' => 0],
        ['key' => 'bronze_ii', 'name' => 'BRONZE', 'tier' => 'bronze', 'division' => 'II', 'minimum_sp' => 100],
        ['key' => 'bronze_iii', 'name' => 'BRONZE', 'tier' => 'bronze', 'division' => 'III', 'minimum_sp' => 200],
        ['key' => 'silver_i', 'name' => 'SILVER', 'tier' => 'silver', 'division' => 'I', 'minimum_sp' => 300],
        ['key' => 'silver_ii', 'name' => 'SILVER', 'tier' => 'silver', 'division' => 'II', 'minimum_sp' => 400],
        ['key' => 'silver_iii', 'name' => 'SILVER', 'tier' => 'silver', 'division' => 'III', 'minimum_sp' => 500],
        ['key' => 'gold_i', 'name' => 'GOLD', 'tier' => 'gold', 'division' => 'I', 'minimum_sp' => 600],
        ['key' => 'gold_ii', 'name' => 'GOLD', 'tier' => 'gold', 'division' => 'II', 'minimum_sp' => 700],
        ['key' => 'gold_iii', 'name' => 'GOLD', 'tier' => 'gold', 'division' => 'III', 'minimum_sp' => 800],
        ['key' => 'platinum_i', 'name' => 'PLATINUM', 'tier' => 'platinum', 'division' => 'I', 'minimum_sp' => 900],
        ['key' => 'platinum_ii', 'name' => 'PLATINUM', 'tier' => 'platinum', 'division' => 'II', 'minimum_sp' => 1000],
        ['key' => 'platinum_iii', 'name' => 'PLATINUM', 'tier' => 'platinum', 'division' => 'III', 'minimum_sp' => 1100],
        ['key' => 'diamond_i', 'name' => 'DIAMOND', 'tier' => 'diamond', 'division' => 'I', 'minimum_sp' => 1200],
        ['key' => 'diamond_ii', 'name' => 'DIAMOND', 'tier' => 'diamond', 'division' => 'II', 'minimum_sp' => 1300],
        ['key' => 'diamond_iii', 'name' => 'DIAMOND', 'tier' => 'diamond', 'division' => 'III', 'minimum_sp' => 1400],
        ['key' => 'master_i', 'name' => 'MASTER', 'tier' => 'master', 'division' => 'I', 'minimum_sp' => 1500],
        ['key' => 'master_ii', 'name' => 'MASTER', 'tier' => 'master', 'division' => 'II', 'minimum_sp' => 1600],
        ['key' => 'master_iii', 'name' => 'MASTER', 'tier' => 'master', 'division' => 'III', 'minimum_sp' => 1700],
        ['key' => 'grandmaster_i', 'name' => 'GRANDMASTER', 'tier' => 'grandmaster', 'division' => 'I', 'minimum_sp' => 1800],
        ['key' => 'grandmaster_ii', 'name' => 'GRANDMASTER', 'tier' => 'grandmaster', 'division' => 'II', 'minimum_sp' => 1900],
        ['key' => 'grandmaster_iii', 'name' => 'GRANDMASTER', 'tier' => 'grandmaster', 'division' => 'III', 'minimum_sp' => 2000],
        ['key' => 'legend', 'name' => 'LEGEND', 'tier' => 'legend', 'division' => null, 'minimum_sp' => 2100],
    ];

    public function calculate(int $seasonPoints): SeasonRank
    {
        if ($seasonPoints < 0) {
            return new SeasonRank(
                key: 'unranked',
                name: 'UNRANKED',
                tier: 'unranked',
                division: null,
                displayName: 'UNRANKED',
                minimumSp: null,
                nextThreshold: 0,
                nextRank: 'BRONZE I',
                progressCurrent: null,
                progressRequired: null,
                progressPercent: null,
                spToNext: abs($seasonPoints),
                topRank: false,
            );
        }

        $rankIndex = $this->rankIndexForPoints($seasonPoints);
        $definition = self::RANKS[$rankIndex];
        $nextDefinition = self::RANKS[$rankIndex + 1] ?? null;

        if ($nextDefinition === null) {
            return $this->makeRank($definition, topRank: true);
        }

        $progressRequired = $nextDefinition['minimum_sp'] - $definition['minimum_sp'];
        $progressCurrent = $seasonPoints - $definition['minimum_sp'];

        return $this->makeRank(
            definition: $definition,
            nextThreshold: $nextDefinition['minimum_sp'],
            nextRank: $this->displayName($nextDefinition),
            progressCurrent: $progressCurrent,
            progressRequired: $progressRequired,
            progressPercent: (int) floor(($progressCurrent / $progressRequired) * 100),
            spToNext: $nextDefinition['minimum_sp'] - $seasonPoints,
        );
    }

    public function fromSnapshot(string $rankKey): SeasonRank
    {
        if ($rankKey === 'unranked') {
            return new SeasonRank(
                key: 'unranked',
                name: 'UNRANKED',
                tier: 'unranked',
                division: null,
                displayName: 'UNRANKED',
                minimumSp: null,
                nextThreshold: null,
                nextRank: null,
                progressCurrent: null,
                progressRequired: null,
                progressPercent: null,
                spToNext: null,
                topRank: false,
            );
        }

        $definition = $this->definitionForKey($rankKey);

        return $this->makeRank($definition, topRank: $rankKey === 'legend');
    }

    public function supportsSnapshot(string $rankKey): bool
    {
        if ($rankKey === 'unranked') {
            return true;
        }

        foreach (self::RANKS as $rank) {
            if ($rank['key'] === $rankKey) {
                return true;
            }
        }

        return false;
    }

    private function rankIndexForPoints(int $seasonPoints): int
    {
        for ($index = count(self::RANKS) - 1; $index >= 0; $index--) {
            if ($seasonPoints >= self::RANKS[$index]['minimum_sp']) {
                return $index;
            }
        }

        throw new InvalidArgumentException('Non-negative Season SP must resolve to a Rank.');
    }

    /** @return array{key: string, name: string, tier: string, division: string|null, minimum_sp: int} */
    private function definitionForKey(string $rankKey): array
    {
        foreach (self::RANKS as $definition) {
            if ($definition['key'] === $rankKey) {
                return $definition;
            }
        }

        throw new InvalidArgumentException("Unknown Season Rank snapshot [{$rankKey}].");
    }

    /**
     * @param  array{key: string, name: string, tier: string, division: string|null, minimum_sp: int}  $definition
     */
    private function makeRank(
        array $definition,
        ?int $nextThreshold = null,
        ?string $nextRank = null,
        ?int $progressCurrent = null,
        ?int $progressRequired = null,
        ?int $progressPercent = null,
        ?int $spToNext = null,
        bool $topRank = false,
    ): SeasonRank {
        return new SeasonRank(
            key: $definition['key'],
            name: $definition['name'],
            tier: $definition['tier'],
            division: $definition['division'],
            displayName: $this->displayName($definition),
            minimumSp: $definition['minimum_sp'],
            nextThreshold: $nextThreshold,
            nextRank: $nextRank,
            progressCurrent: $progressCurrent,
            progressRequired: $progressRequired,
            progressPercent: $progressPercent,
            spToNext: $spToNext,
            topRank: $topRank,
        );
    }

    /**
     * @param  array{name: string, division: string|null}  $definition
     */
    private function displayName(array $definition): string
    {
        return trim("{$definition['name']} {$definition['division']}");
    }
}
