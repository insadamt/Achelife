<?php

namespace App\Enums;

enum TaskFocusSessionSource: string
{
    case Timer = 'timer';
    case Manual = 'manual';
}
