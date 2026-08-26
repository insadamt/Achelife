import { ArrowDownLeft, ArrowRightLeft, ArrowUpRight } from 'lucide-react';

import { formatMinorUnits, transactionSignedAmount, transactionTitle } from './moneyPresentation';
import type { MoneyTransactionData } from './types';

export function ActivityItem({ transaction, contextAccountId, onClick }: { transaction: MoneyTransactionData; contextAccountId?: number; onClick: () => void }) {
    const signedAmount = transactionSignedAmount(transaction, contextAccountId);
    const currency = transaction.account.currency;
    const globalTransfer = transaction.type === 'transfer' && contextAccountId === undefined;
    const TransactionIcon = transaction.type === 'income' ? ArrowDownLeft : transaction.type === 'expense' ? ArrowUpRight : ArrowRightLeft;

    return (
        <button className="focus-ring flex w-full items-center gap-4 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-surface-hover" onClick={onClick} type="button">
            <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${transaction.type === 'income' ? 'bg-success/10 text-success' : transaction.type === 'expense' ? 'bg-danger/10 text-danger' : 'bg-[color-mix(in_srgb,var(--money-accent)_12%,transparent)] text-[var(--money-accent)]'}`}>
                <TransactionIcon aria-hidden="true" size={19} />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate font-bold text-foreground">{transactionTitle(transaction, contextAccountId)}</span>
                <span className="mt-0.5 block truncate text-sm text-muted">
                    {transaction.type === 'transfer' ? `${transaction.account.name} → ${transaction.destinationAccount?.name}` : transaction.account.name}
                    {transaction.type === 'transfer' && transaction.feeMinor > 0 ? ` · Fee ${formatMinorUnits(transaction.feeMinor, currency)}` : ''}
                    {transaction.note ? ` · ${transaction.note}` : ''}
                </span>
            </span>
            <span className={`shrink-0 text-right font-bold tabular-nums ${globalTransfer ? 'text-secondary' : signedAmount > 0 ? 'text-success' : signedAmount < 0 ? 'text-foreground' : 'text-secondary'}`}>
                {globalTransfer && <span className="mb-0.5 block text-[0.625rem] font-bold tracking-[0.12em] text-muted uppercase">Transfer</span>}
                {!globalTransfer && signedAmount > 0 ? '+' : ''}{formatMinorUnits(globalTransfer ? transaction.amountMinor : signedAmount, currency)}
            </span>
        </button>
    );
}
