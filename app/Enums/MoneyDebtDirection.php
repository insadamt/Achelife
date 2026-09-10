<?php

namespace App\Enums;

enum MoneyDebtDirection: string
{
    case Payable = 'payable';
    case Receivable = 'receivable';
}
