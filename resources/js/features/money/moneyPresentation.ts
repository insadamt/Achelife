import type { MoneyTransactionData } from './types';

export function formatMinorUnits(minorUnits: number, currency: string, includeCurrency = true): string {
    const amount = minorUnits / 100;
    const hasFraction = Math.abs(minorUnits) % 100 !== 0;
    const number = new Intl.NumberFormat(undefined, {
        minimumFractionDigits: hasFraction ? 2 : 0,
        maximumFractionDigits: 2,
    }).format(amount);

    return includeCurrency ? `${number} ${currency}` : number;
}

export function formatMoneyGroupDate(value: string): string {
    const relativeDate = formatMoneyDate(value);

    if (relativeDate === 'Today' || relativeDate === 'Yesterday') return relativeDate;

    const date = new Date(`${value}T12:00:00`);
    const currentYear = new Date().getFullYear();

    return new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() === currentYear ? undefined : 'numeric',
    }).format(date);
}

export function groupTransactionsByDate(transactions: MoneyTransactionData[]): Array<[string, MoneyTransactionData[]]> {
    const groups = new Map<string, MoneyTransactionData[]>();

    for (const transaction of transactions) {
        const existingGroup = groups.get(transaction.date) ?? [];
        existingGroup.push(transaction);
        groups.set(transaction.date, existingGroup);
    }

    return Array.from(groups.entries());
}

export function minorUnitsInput(minorUnits: number): string {
    return (minorUnits / 100).toFixed(2);
}

export function formatMoneyDate(value: string): string {
    const date = new Date(`${value}T12:00:00`);
    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (value === todayKey) return 'Today';
    if (value === yesterday.toISOString().slice(0, 10)) return 'Yesterday';

    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric' }).format(date);
}

export function transactionTitle(transaction: MoneyTransactionData, contextAccountId?: number): string {
    if (transaction.type !== 'transfer') {
        return transaction.subcategory
            ? `${transaction.category?.name} · ${transaction.subcategory.name}`
            : transaction.category?.name ?? transaction.type;
    }

    if (contextAccountId === transaction.destinationAccount?.id) return `Transfer from ${transaction.account.name}`;
    if (contextAccountId === transaction.account.id) return `Transfer to ${transaction.destinationAccount?.name}`;

    return `${transaction.account.name} → ${transaction.destinationAccount?.name}`;
}

export function transactionSignedAmount(transaction: MoneyTransactionData, contextAccountId?: number): number {
    if (transaction.type === 'income') return transaction.amountMinor;
    if (transaction.type === 'expense') return -transaction.amountMinor;
    if (contextAccountId === transaction.destinationAccount?.id) return transaction.amountMinor;
    if (contextAccountId === transaction.account.id) return -(transaction.amountMinor + transaction.feeMinor);
    return transaction.amountMinor;
}
