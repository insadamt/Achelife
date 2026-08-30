<?php

namespace App\Enums;

enum MoneySubscriptionStatus: string
{
    case Active = 'active';
    case Paused = 'paused';
    case Ended = 'ended';
}
