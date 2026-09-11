import { Head, Link } from '@inertiajs/react';
import { Archive, ArrowDownLeft, ArrowRight, ArrowRightLeft, ArrowUpRight, CalendarClock, HandCoins, Plus } from 'lucide-react';
import { useState } from 'react';
import type { CSSProperties } from 'react';

import { Button, Surface } from '../../components/ui';
import { AccountListItem } from '../../features/money/AccountCard';
import { AccountFormDrawer } from '../../features/money/AccountFormDrawer';
import { ActivityList } from '../../features/money/ActivityList';
import { MoneyBalanceSummary } from '../../features/money/MoneyBalanceSummary';
import { MoneyFloatingActionMenu } from '../../features/money/MoneyFloatingActionMenu';
import { MoneyPageHeader } from '../../features/money/MoneyPageHeader';
import { MoneySubscriptionSummary } from '../../features/money/MoneySubscriptionSummary';
import { TransactionDrawer } from '../../features/money/TransactionDrawer';
import type { MoneyAccountData, MoneyCategoryData, MoneySubscriptionOccurrenceData, MoneyTransactionData, MoneyTransactionType } from '../../features/money/types';

interface MoneyIndexProps {
    today: string;
    accounts: MoneyAccountData[];
    totalsByCurrency: Record<string, number>;
    categories: MoneyCategoryData[];
    recentTransactions: MoneyTransactionData[];
    dueSubscriptions: MoneySubscriptionOccurrenceData[];
    upcomingSubscriptions: MoneySubscriptionOccurrenceData[];
}

const moduleStyle = { '--module-accent': 'var(--money-accent)' } as CSSProperties;

export default function MoneyIndex(props: MoneyIndexProps) {
    const [accountFormOpen, setAccountFormOpen] = useState(false);
    const [creatingType, setCreatingType] = useState<MoneyTransactionType | null>(null);
    const [selectedTransaction, setSelectedTransaction] = useState<MoneyTransactionData | null>(null);

    return (
        <div style={moduleStyle}>
            <Head title="Money" />
            <MoneyPageHeader active="overview" description="See what you have, record what changed, and keep every Account in view." title="Overview" />

            <MoneyBalanceSummary accounts={props.accounts} totalsByCurrency={props.totalsByCurrency} />

            <MoneySubscriptionSummary due={props.dueSubscriptions} upcoming={props.upcomingSubscriptions} />

            <section className="mt-8">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-base font-bold">Recent activity</h2>
                    {props.recentTransactions.length > 0 && <Link className="icon-text flex items-center gap-1.5 text-sm font-bold text-accent-ink hover:underline" href="/money/history">View all <ArrowRight aria-hidden="true" size={15} /></Link>}
                </div>
                <Surface className="p-2 sm:p-3" elevated>
                    <ActivityList
                        emptyMessage="Income, Expenses, and Transfers will appear here."
                        onSelect={setSelectedTransaction}
                        transactions={props.recentTransactions.slice(0, 6)}
                    />
                </Surface>
            </section>

            <section className="mt-8">
                <div className="mb-4 flex items-center justify-between gap-4">
                    <h2 className="text-base font-bold">Accounts</h2>
                    <div className="flex items-center gap-2">
                        <Button onClick={() => setAccountFormOpen(true)} size="small" variant="secondary">
                            <Plus aria-hidden="true" size={16} /> Account
                        </Button>
                    </div>
                </div>
                {props.accounts.length > 0 ? (
                    <Surface className="divide-y divide-border-subtle p-2" elevated>
                        {props.accounts.map((account) => (
                            <AccountListItem account={account} key={account.id} />
                        ))}
                    </Surface>
                ) : (
                    <Surface className="grid min-h-56 place-items-center p-7 text-center" elevated>
                        <div>
                            <p className="text-2xl font-bold">Your wallet is empty</p>
                            <Button className="mt-5" onClick={() => setAccountFormOpen(true)}><Plus aria-hidden="true" size={17} />Create first Account</Button>
                        </div>
                    </Surface>
                )}
                <Link className="focus-ring mt-1 inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-bold text-muted hover:text-foreground" href="/money/accounts/archived">
                    <Archive aria-hidden="true" size={16} /> Archived Accounts
                </Link>
            </section>

            {accountFormOpen && <AccountFormDrawer onClose={() => setAccountFormOpen(false)} />}
            {creatingType && <TransactionDrawer accounts={props.accounts} categories={props.categories} initialType={creatingType} onClose={() => setCreatingType(null)} today={props.today} />}
            {selectedTransaction && <TransactionDrawer accounts={props.accounts} categories={props.categories} onClose={() => setSelectedTransaction(null)} today={props.today} transaction={selectedTransaction} />}
            {!accountFormOpen && !creatingType && !selectedTransaction && <MoneyFloatingActionMenu actions={[
                { icon: ArrowDownLeft, label: 'Income', onSelect: () => setCreatingType('income'), tone: 'income' },
                { icon: ArrowUpRight, label: 'Expense', onSelect: () => setCreatingType('expense'), tone: 'expense' },
                { icon: ArrowRightLeft, label: 'Transfer', onSelect: () => setCreatingType('transfer') },
                { href: '/money/debts?create=1', icon: HandCoins, label: 'Debt' },
                { href: '/money/subscriptions?create=1', icon: CalendarClock, label: 'Subscription' },
            ]} />}
        </div>
    );
}
