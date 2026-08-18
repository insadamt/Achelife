import { formatMinorUnits, formatMoneyDate, transactionSignedAmount, transactionTitle } from './moneyPresentation';
import type { MoneyTransactionData } from './types';

export function ActivityItem({ transaction, contextAccountId, onClick }: { transaction: MoneyTransactionData; contextAccountId?: number; onClick: () => void }) {
    const signedAmount = transactionSignedAmount(transaction, contextAccountId);
    const currency = transaction.account.currency;
    const globalTransfer = transaction.type === 'transfer' && contextAccountId === undefined;

    return (
        <button className="focus-ring flex w-full items-center gap-4 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-surface-hover" onClick={onClick} type="button">
            <span className={`grid size-11 shrink-0 place-items-center rounded-2xl text-lg font-bold ${transaction.type === 'income' ? 'bg-success/10 text-success' : transaction.type === 'expense' ? 'bg-danger/10 text-danger' : 'bg-[color-mix(in_srgb,var(--money-accent)_12%,transparent)] text-[var(--money-accent)]'}`}>
                {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '−' : '↔'}
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate font-bold text-foreground">{transactionTitle(transaction, contextAccountId)}</span>
                <span className="mt-0.5 block truncate text-sm text-muted">
                    {transaction.type === 'transfer' ? `${transaction.account.name} → ${transaction.destinationAccount?.name}` : transaction.account.name} · {formatMoneyDate(transaction.date)}
                    {transaction.note ? ` · ${transaction.note}` : ''}
                </span>
            </span>
            <span className={`shrink-0 text-right font-bold ${globalTransfer ? 'text-[var(--money-accent)]' : signedAmount > 0 ? 'text-success' : signedAmount < 0 ? 'text-foreground' : 'text-secondary'}`}>
                {!globalTransfer && signedAmount > 0 ? '+' : ''}{formatMinorUnits(signedAmount, currency)}
            </span>
        </button>
    );
}
