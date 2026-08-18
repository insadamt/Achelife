<?php

namespace App\Enums;

enum HabitOccurrenceKind: string
{
    case Required = 'required';
    case FlexibleExtra = 'flexible_extra';
}
