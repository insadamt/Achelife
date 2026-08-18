<?php

namespace App\Data\Seasons;

final readonly class SeasonRank
{
    public function __construct(
        public string $key,
        public string $name,
        public string $tier,
        public ?string $division,
        public string $displayName,
        public ?int $minimumSp,
        public ?int $nextThreshold,
        public ?string $nextRank,
        public ?int $progressCurrent,
        public ?int $progressRequired,
        public ?int $progressPercent,
        public ?int $spToNext,
        public bool $topRank,
    ) {}

    /** @return array<string, bool|int|string|null> */
    public function toArray(): array
    {
        return [
            'key' => $this->key,
            'name' => $this->name,
            'tier' => $this->tier,
            'division' => $this->division,
            'displayName' => $this->displayName,
            'minimumSp' => $this->minimumSp,
            'nextThreshold' => $this->nextThreshold,
            'nextRank' => $this->nextRank,
            'progressCurrent' => $this->progressCurrent,
            'progressRequired' => $this->progressRequired,
            'progressPercent' => $this->progressPercent,
            'spToNext' => $this->spToNext,
            'topRank' => $this->topRank,
        ];
    }
}
