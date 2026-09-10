<?php

namespace App\Enums;

enum MoneyDebtSettlementType: string
{
    case Repayment = 'repayment';
    case Forgiveness = 'forgiveness';
}
