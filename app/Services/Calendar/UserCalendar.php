<?php

namespace App\Services\Calendar;

use App\Models\User;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;

class UserCalendar
{
    public function today(User $user, ?CarbonInterface $instant = null): CarbonImmutable
    {
        $currentInstant = $instant === null
            ? CarbonImmutable::now('UTC')
            : CarbonImmutable::instance($instant);

        return $this->neutralDate($currentInstant->setTimezone($user->timezone)->toDateString());
    }

    public function dateOf(User $user, CarbonInterface $instant): CarbonImmutable
    {
        $localDate = CarbonImmutable::instance($instant)->setTimezone($user->timezone)->toDateString();

        return $this->neutralDate($localDate);
    }

    private function neutralDate(string $date): CarbonImmutable
    {
        return CarbonImmutable::createFromFormat('!Y-m-d', $date, 'UTC');
    }
}
