<?php

namespace App\Enums;

enum MoneySubscriptionRecurrence: string
{
    case Weekly = 'weekly';
    case Monthly = 'monthly';
    case EveryThreeMonths = 'every_three_months';
    case Yearly = 'yearly';
}
