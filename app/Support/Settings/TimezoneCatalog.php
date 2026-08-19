<?php

namespace App\Support\Settings;

use Carbon\CarbonImmutable;
use DateTimeZone;

class TimezoneCatalog
{
    /** @return list<array{value: string, label: string}> */
    public function all(): array
    {
        $now = CarbonImmutable::now('UTC');

        return collect(DateTimeZone::listIdentifiers())
            ->prepend('UTC')
            ->unique()
            ->map(function (string $timezone) use ($now): array {
                $offset = $now->setTimezone($timezone)->format('P');
                $location = str_replace(['_', '/'], [' ', ' · '], $timezone);

                return [
                    'value' => $timezone,
                    'label' => "{$location} (UTC{$offset})",
                ];
            })
            ->values()
            ->all();
    }
}
