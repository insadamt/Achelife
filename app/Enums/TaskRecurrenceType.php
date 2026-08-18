<?php

namespace App\Enums;

enum TaskRecurrenceType: string
{
    case Daily = 'daily';
    case Weekdays = 'weekdays';
}
