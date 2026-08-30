<?php

namespace App\Enums;

enum MoneySubscriptionPaymentMode: string
{
    case Automatic = 'automatic';
    case Manual = 'manual';
}
