<?php

namespace App\Services\Tasks;

use Carbon\CarbonImmutable;
use DateTimeZone;
use Illuminate\Validation\ValidationException;

class LocalFocusTimestampParser
{
    public function parse(string $value, string $timezone, string $field): CarbonImmutable
    {
        $normalized = $this->normalizedTimestamp($value, $field);
        $localTimestamp = CarbonImmutable::createFromFormat('!Y-m-d H:i:s', $normalized, 'UTC');

        if ($localTimestamp === false || $localTimestamp->format('Y-m-d H:i:s') !== $normalized) {
            $this->reject($field, 'Enter a valid local date and time.');
        }

        $zone = new DateTimeZone($timezone);
        $candidateOffsets = collect($zone->getTransitions(
            $localTimestamp->timestamp - (3 * 86400),
            $localTimestamp->timestamp + (3 * 86400),
        ))->pluck('offset')->unique();
        $matchingInstants = $candidateOffsets
            ->map(fn (int $offset) => CarbonImmutable::createFromTimestampUTC($localTimestamp->timestamp - $offset))
            ->filter(fn (CarbonImmutable $instant) => $instant->setTimezone($zone)->format('Y-m-d H:i:s') === $normalized)
            ->unique(fn (CarbonImmutable $instant) => $instant->timestamp)
            ->values();

        if ($matchingInstants->count() !== 1) {
            $this->reject($field, $matchingInstants->isEmpty()
                ? 'This local time does not exist because of a timezone transition.'
                : 'This local time is ambiguous because of a timezone transition. Choose another time.');
        }

        return $matchingInstants->sole()->utc();
    }

    private function normalizedTimestamp(string $value, string $field): string
    {
        if (! preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/', $value)) {
            $this->reject($field, 'Enter a date and time in the expected format.');
        }

        return str_replace('T', ' ', strlen($value) === 16 ? $value.':00' : $value);
    }

    private function reject(string $field, string $message): never
    {
        throw ValidationException::withMessages([$field => $message]);
    }
}
