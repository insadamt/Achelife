import { ActivityItem } from './ActivityItem';
import { formatMoneyGroupDate, groupTransactionsByDate } from './moneyPresentation';
import type { MoneyTransactionData } from './types';

interface ActivityListProps {
    emptyMessage: string;
    onSelect: (transaction: MoneyTransactionData) => void;
    transactions: MoneyTransactionData[];
    contextAccountId?: number;
}

export function ActivityList({ contextAccountId, emptyMessage, onSelect, transactions }: ActivityListProps) {
    if (transactions.length === 0) {
        return <p className="px-5 py-12 text-center text-secondary">{emptyMessage}</p>;
    }

    return (
        <div className="space-y-2">
            {groupTransactionsByDate(transactions).map(([date, groupedTransactions]) => (
                <section key={date}>
                    <p className="px-3 pt-3 pb-1 text-[0.65rem] font-bold tracking-[0.16em] text-muted uppercase">
                        {formatMoneyGroupDate(date)}
                    </p>
                    {groupedTransactions.map((transaction) => (
                        <ActivityItem
                            contextAccountId={contextAccountId}
                            key={transaction.id}
                            onClick={() => onSelect(transaction)}
                            transaction={transaction}
                        />
                    ))}
                </section>
            ))}
        </div>
    );
}
