<?php

namespace App\Enums;

enum HabitOccurrenceState: string
{
    case Pending = 'pending';
    case Completed = 'completed';
    case Skipped = 'skipped';
    case Missed = 'missed';
}
