import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import type { CSSProperties } from 'react';

import { Button, Surface } from '../../components/ui';
import { AccountCard } from '../../features/money/AccountCard';
import { AccountFormDrawer } from '../../features/money/AccountFormDrawer';
import { ActivityItem } from '../../features/money/ActivityItem';
import { TransactionDrawer } from '../../features/money/TransactionDrawer';
import { formatMinorUnits } from '../../features/money/moneyPresentation';
import type { MoneyAccountData, MoneyCategoryData, MoneyTransactionData } from '../../features/money/types';

interface MoneyIndexProps {
    today: string;
    accounts: MoneyAccountData[];
    totalsByCurrency: Record<string, number>;
    categories: MoneyCategoryData[];
    recentTransactions: MoneyTransactionData[];
}

const moduleStyle = { '--module-accent': 'var(--money-accent)' } as CSSProperties;

export default function MoneyIndex(props: MoneyIndexProps) {
    const [accountFormOpen, setAccountFormOpen] = useState(false);
    const [transactionFormOpen, setTransactionFormOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<MoneyTransactionData | null>(null);
    const totals = Object.entries(props.totalsByCurrency);

    return (
        <div style={moduleStyle}>
            <Head title="Money" />
            <header className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <div><p className="text-xs font-bold tracking-[0.2em] text-[var(--money-accent)] uppercase">Personal wallet</p><h1 className="mt-2 text-5xl font-bold tracking-[-0.055em] sm:text-6xl">Money</h1><p className="mt-2 max-w-xl text-sm leading-6 text-secondary sm:text-base">Your real balances and financial history, kept completely outside Achelife progression.</p></div>
                <nav className="flex flex-wrap gap-2 text-sm font-bold"><Link className="focus-ring rounded-full border border-border-strong bg-elevated px-4 py-2.5 hover:bg-surface-hover" href="/money/history">History</Link><Link className="focus-ring rounded-full border border-border-strong bg-elevated px-4 py-2.5 hover:bg-surface-hover" href="/money/categories">Categories</Link><Link className="focus-ring rounded-full border border-border-strong bg-elevated px-4 py-2.5 hover:bg-surface-hover" href="/money/accounts/archived">Archived</Link></nav>
            </header>

            <Surface className="money-balance-hero mb-7 overflow-hidden p-6 sm:p-8" elevated>
                <p className="text-[0.625rem] font-bold tracking-[0.2em] text-[var(--money-accent)] uppercase">Total balance</p>
                {totals.length > 0 ? <div className="mt-4 flex flex-wrap gap-x-9 gap-y-2">{totals.map(([currency, amount]) => <p className="text-3xl font-bold tracking-[-0.04em] sm:text-5xl" key={currency}>{formatMinorUnits(amount, currency)}</p>)}</div> : <><p className="mt-3 text-4xl font-bold">No balances yet</p><p className="mt-2 text-sm text-secondary">Add an Account to assemble your wallet.</p></>}
            </Surface>

            <div className="mb-9 flex flex-wrap gap-3"><Button disabled={props.accounts.length === 0} onClick={() => setTransactionFormOpen(true)}>+ Transaction</Button><Button onClick={() => setAccountFormOpen(true)} variant="secondary">+ Account</Button></div>

            <section className="mb-10">
                <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-bold tracking-[0.17em] text-secondary uppercase">Accounts</h2><span className="text-xs font-semibold text-muted">{props.accounts.length} active</span></div>
                {props.accounts.length > 0 ? <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-6 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-3">{props.accounts.map((account) => <div className="snap-center" key={account.id}><AccountCard account={account} /></div>)}</div> : <Surface className="grid min-h-56 place-items-center p-7 text-center" elevated><div><p className="text-2xl font-bold">Your wallet is empty</p><p className="mt-2 text-sm text-secondary">Create Cash, Bank, or another Account in its real currency.</p><Button className="mt-5" onClick={() => setAccountFormOpen(true)}>Create first Account</Button></div></Surface>}
            </section>

            <section>
                <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-bold tracking-[0.17em] text-secondary uppercase">Recent activity</h2>{props.recentTransactions.length > 0 && <Link className="text-sm font-bold text-[var(--money-accent)] hover:underline" href="/money/history">View all</Link>}</div>
                <Surface className="p-2 sm:p-3" elevated>{props.recentTransactions.length > 0 ? props.recentTransactions.map((transaction) => <ActivityItem key={transaction.id} onClick={() => setSelectedTransaction(transaction)} transaction={transaction} />) : <p className="px-5 py-12 text-center text-secondary">Income, Expenses, and Transfers will appear here.</p>}</Surface>
            </section>

            {accountFormOpen && <AccountFormDrawer onClose={() => setAccountFormOpen(false)} />}
            {transactionFormOpen && <TransactionDrawer accounts={props.accounts} categories={props.categories} onClose={() => setTransactionFormOpen(false)} today={props.today} />}
            {selectedTransaction && <TransactionDrawer accounts={props.accounts} categories={props.categories} onClose={() => setSelectedTransaction(null)} today={props.today} transaction={selectedTransaction} />}
        </div>
    );
}
