<?php

namespace App\Enums;

enum MoneySubscriptionOccurrenceStatus: string
{
    case Due = 'due';
    case Paid = 'paid';
    case Skipped = 'skipped';
}
