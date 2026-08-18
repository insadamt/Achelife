<?php

namespace App\Enums;

enum HabitScheduleType: string
{
    case EveryDay = 'every_day';
    case SelectedWeekdays = 'selected_weekdays';
}
