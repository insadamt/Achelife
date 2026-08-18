<?php

namespace App\Services\Habits;

use App\Models\Habit;
use App\Models\HabitDefinitionVersion;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use RuntimeException;

class HabitDefinitionResolver
{
    public function forDate(Habit $habit, CarbonImmutable $date): HabitDefinitionVersion
    {
        $definition = $habit->definitionVersions()
            ->whereDate('effective_from', '<=', $date)
            ->latest('effective_from')
            ->first();

        if ($definition === null) {
            throw new RuntimeException("Habit {$habit->id} has no definition for {$date->toDateString()}.");
        }

        return $definition;
    }

    /**
     * @param  Collection<int, HabitDefinitionVersion>  $definitions
     */
    public function fromLoadedVersions(Collection $definitions, CarbonImmutable $date): HabitDefinitionVersion
    {
        $definition = $definitions
            ->filter(fn (HabitDefinitionVersion $version) => $version->effective_from->lessThanOrEqualTo($date))
            ->last();

        if ($definition === null) {
            throw new RuntimeException("No Habit definition is effective on {$date->toDateString()}.");
        }

        return $definition;
    }
}
