<?php

namespace App\Services\Habits;

use App\Enums\HabitScheduleType;
use App\Models\HabitDefinitionVersion;
use Carbon\CarbonImmutable;

class HabitSchedule
{
    public function isRequired(HabitDefinitionVersion $definition, CarbonImmutable $date): bool
    {
        if ($definition->schedule_type === HabitScheduleType::EveryDay) {
            return true;
        }

        return in_array($date->isoWeekday(), $definition->weekdays ?? [], true);
    }

    public function isFlexibleExtraAvailable(HabitDefinitionVersion $definition, CarbonImmutable $date): bool
    {
        return $definition->schedule_type === HabitScheduleType::SelectedWeekdays
            && $definition->flexible
            && ! $this->isRequired($definition, $date);
    }
}
