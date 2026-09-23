<?php

namespace App\Services\Money;

use App\Enums\MoneyCategoryType;
use App\Models\User;

class MoneyCategoryColorService
{
    private const DEFAULT_COLOR = '#2563EB';

    public function uniqueColor(User $user, MoneyCategoryType $type, ?string $requestedColor, ?int $exceptCategoryId = null): string
    {
        $usedColors = $user->moneyCategories()
            ->where('type', $type)
            ->when($exceptCategoryId !== null, fn ($query) => $query->whereKeyNot($exceptCategoryId))
            ->whereNotNull('color')
            ->pluck('color')
            ->map(fn (string $color): string => strtoupper($color))
            ->all();
        $candidate = strtoupper($requestedColor ?? self::DEFAULT_COLOR);

        if (! in_array($candidate, $usedColors, true)) {
            return $candidate;
        }

        for ($attempt = 1; $attempt <= 360; $attempt++) {
            $candidate = $this->colorAt($attempt);
            if (! in_array($candidate, $usedColors, true)) {
                return $candidate;
            }
        }

        return $candidate;
    }

    private function colorAt(int $attempt): string
    {
        $hue = fmod($attempt * 137.508, 360);
        $chroma = (1 - abs(2 * 0.56 - 1)) * 0.64;
        $secondary = $chroma * (1 - abs(fmod($hue / 60, 2) - 1));
        $channels = match (true) {
            $hue < 60 => [$chroma, $secondary, 0],
            $hue < 120 => [$secondary, $chroma, 0],
            $hue < 180 => [0, $chroma, $secondary],
            $hue < 240 => [0, $secondary, $chroma],
            $hue < 300 => [$secondary, 0, $chroma],
            default => [$chroma, 0, $secondary],
        };
        $offset = 0.56 - $chroma / 2;

        return strtoupper('#'.collect($channels)->map(fn (float $channel): string => str_pad(dechex((int) round(($channel + $offset) * 255)), 2, '0', STR_PAD_LEFT))->implode(''));
    }
}
