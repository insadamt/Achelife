<?php

namespace App\Enums;

enum SeasonRolloverPreference: string
{
    case Automatic = 'automatic';
    case Manual = 'manual';
}
