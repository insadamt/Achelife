import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import type { CSSProperties } from 'react';

import { Button, Surface } from '../../../components/ui';
import { AccountCard } from '../../../features/money/AccountCard';
import { AccountFormDrawer } from '../../../features/money/AccountFormDrawer';
import { ActivityItem } from '../../../features/money/ActivityItem';
import { TransactionDrawer } from '../../../features/money/TransactionDrawer';
import { formatMinorUnits } from '../../../features/money/moneyPresentation';
import type { MoneyAccountData, MoneyCategoryData, MoneyTransactionData, MoneyTransactionType } from '../../../features/money/types';

interface AccountShowProps {
    today: string;
    account: MoneyAccountData;
    accounts: MoneyAccountData[];
    categories: MoneyCategoryData[];
    transactions: MoneyTransactionData[];
}

export default function AccountShow(props: AccountShowProps) {
    const [editingAccount, setEditingAccount] = useState(false);
    const [creatingType, setCreatingType] = useState<MoneyTransactionType | null>(null);
    const [selectedTransaction, setSelectedTransaction] = useState<MoneyTransactionData | null>(null);

    function archive() {
        if (window.confirm(`Archive ${props.account.name}? It will no longer be available for new transactions.`)) router.post(`/money/accounts/${props.account.id}/archive`);
    }
    function reactivate() { router.post(`/money/accounts/${props.account.id}/reactivate`, {}, { preserveScroll: true }); }
    function destroy() {
        if (window.confirm(`Delete unused Account ${props.account.name} permanently?`)) router.delete(`/money/accounts/${props.account.id}`);
    }

    return (
        <div style={{ '--module-accent': 'var(--money-accent)' } as CSSProperties}>
            <Head title={`${props.account.name} · Money`} />
            <Link className="text-sm font-bold text-muted hover:text-foreground" href={props.account.archivedAt ? '/money/accounts/archived' : '/money'}>← Back to {props.account.archivedAt ? 'Archived Accounts' : 'Money'}</Link>
            <header className="mt-6 mb-7"><p className="text-xs font-bold tracking-[0.2em] text-[var(--money-accent)] uppercase">{props.account.currency} Account</p><h1 className="mt-2 text-4xl font-bold tracking-[-0.05em] sm:text-5xl">{props.account.name}</h1></header>

            <div className="grid gap-7 xl:grid-cols-[minmax(0,35rem)_1fr] xl:items-center">
                <AccountCard account={props.account} large />
                <div>
                    <p className="text-xs font-bold tracking-[0.16em] text-muted uppercase">Current balance</p><p className="mt-2 text-4xl font-bold tracking-[-0.04em] sm:text-6xl">{formatMinorUnits(props.account.balanceMinor, props.account.currency)}</p>
                    <p className="mt-3 text-sm text-secondary">Initial balance: {formatMinorUnits(props.account.initialBalanceMinor, props.account.currency)} · Wallet ID •••• {props.account.visualIdentifier}</p>
                    {props.account.archivedAt === null ? <div className="mt-6 flex flex-wrap gap-2"><Button onClick={() => setCreatingType('income')}>+ Income</Button><Button onClick={() => setCreatingType('expense')} variant="secondary">− Expense</Button><Button onClick={() => setCreatingType('transfer')} variant="secondary">Transfer</Button></div> : <div className="mt-6 rounded-2xl border border-warning/30 bg-warning/8 p-4"><p className="font-bold text-warning">Archived Account</p><p className="mt-1 text-sm text-secondary">History stays intact. Reactivate before recording new activity.</p><Button className="mt-4" onClick={reactivate}>Reactivate</Button></div>}
                </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-2"><Button onClick={() => setEditingAccount(true)} size="small" variant="ghost">Edit</Button>{props.account.archivedAt === null && <Button onClick={archive} size="small" variant="ghost">Archive</Button>}{props.account.canDelete && <Button onClick={destroy} size="small" variant="destructive">Delete permanently</Button>}</div>

            <section className="mt-10"><div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-bold tracking-[0.17em] text-secondary uppercase">Recent operations</h2><Link className="text-sm font-bold text-[var(--money-accent)] hover:underline" href={`/money/history?account=${props.account.id}`}>Full history</Link></div><Surface className="p-2 sm:p-3" elevated>{props.transactions.length > 0 ? props.transactions.map((transaction) => <ActivityItem contextAccountId={props.account.id} key={transaction.id} onClick={() => setSelectedTransaction(transaction)} transaction={transaction} />) : <p className="px-5 py-12 text-center text-secondary">No operations involve this Account yet.</p>}</Surface></section>

            {editingAccount && <AccountFormDrawer account={props.account} onClose={() => setEditingAccount(false)} />}
            {creatingType && <TransactionDrawer accounts={props.accounts} categories={props.categories} initialAccountId={props.account.id} initialType={creatingType} onClose={() => setCreatingType(null)} today={props.today} />}
            {selectedTransaction && <TransactionDrawer accounts={props.accounts} categories={props.categories} initialAccountId={props.account.id} onClose={() => setSelectedTransaction(null)} today={props.today} transaction={selectedTransaction} />}
        </div>
    );
}
