<?php

namespace App\Enums;

enum SeasonIntermissionReason: string
{
    case ManualRollover = 'manual_rollover';
    case OneTimeHold = 'one_time_hold';
    case Restore = 'restore';
}
