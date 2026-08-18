<?php

namespace App\Enums;

enum MoneyTransactionType: string
{
    case Income = 'income';
    case Expense = 'expense';
    case Transfer = 'transfer';
}
