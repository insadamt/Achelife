import { Head, Link } from '@inertiajs/react';
import { Archive, ArrowRight, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useRef, useState } from 'react';
import type { CSSProperties } from 'react';

import { Button, Surface } from '../../components/ui';
import { AccountCard } from '../../features/money/AccountCard';
import { AccountFormDrawer } from '../../features/money/AccountFormDrawer';
import { ActivityList } from '../../features/money/ActivityList';
import { MoneyBalanceSummary } from '../../features/money/MoneyBalanceSummary';
import { MoneyQuickActions } from '../../features/money/MoneyQuickActions';
import { MoneySectionNav } from '../../features/money/MoneySectionNav';
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
    const accountCarouselRef = useRef<HTMLDivElement>(null);
    const [accountFormOpen, setAccountFormOpen] = useState(false);
    const [creatingType, setCreatingType] = useState<MoneyTransactionType | null>(null);
    const [selectedTransaction, setSelectedTransaction] = useState<MoneyTransactionData | null>(null);

    function scrollAccounts(direction: -1 | 1) {
        accountCarouselRef.current?.scrollBy({ behavior: 'smooth', left: direction * 360 });
    }

    return (
        <div style={moduleStyle}>
            <Head title="Money" />
            <header className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <div>
                    <h1 className="text-5xl font-bold tracking-[-0.055em] sm:text-6xl">Money</h1>
                </div>
                <MoneySectionNav active="overview" />
            </header>

            <MoneyBalanceSummary accounts={props.accounts} totalsByCurrency={props.totalsByCurrency} />

            <section className="mt-5">
                <h2 className="sr-only">Quick actions</h2>
                <MoneyQuickActions disabled={props.accounts.length === 0} onSelect={setCreatingType} />
            </section>

            <MoneySubscriptionSummary due={props.dueSubscriptions} upcoming={props.upcomingSubscriptions} />

            <section className="mt-10">
                <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-sm font-bold tracking-[0.17em] text-secondary uppercase">Accounts</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {props.accounts.length > 1 && (
                            <div className="hidden gap-1 sm:flex">
                                <button aria-label="Previous Account" className="focus-ring grid size-9 place-items-center rounded-full border border-border-strong bg-elevated text-muted hover:bg-surface-hover hover:text-foreground" onClick={() => scrollAccounts(-1)} type="button"><ChevronLeft aria-hidden="true" size={17} /></button>
                                <button aria-label="Next Account" className="focus-ring grid size-9 place-items-center rounded-full border border-border-strong bg-elevated text-muted hover:bg-surface-hover hover:text-foreground" onClick={() => scrollAccounts(1)} type="button"><ChevronRight aria-hidden="true" size={17} /></button>
                            </div>
                        )}
                        <Button onClick={() => setAccountFormOpen(true)} size="small" variant="secondary">
                            <Plus aria-hidden="true" size={16} /> Account
                        </Button>
                    </div>
                </div>
                {props.accounts.length > 0 ? (
                    <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-6 sm:mx-0 sm:px-0" ref={accountCarouselRef}>
                        {props.accounts.map((account) => (
                            <div className="w-[min(78vw,20rem)] shrink-0 snap-center sm:w-80 xl:w-[22rem]" key={account.id}><AccountCard account={account} /></div>
                        ))}
                    </div>
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

            <section className="mt-9">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-bold tracking-[0.17em] text-secondary uppercase">Recent activity</h2>
                    {props.recentTransactions.length > 0 && <Link className="icon-text flex items-center gap-1.5 text-sm font-bold text-[var(--money-accent)] hover:underline" href="/money/history">View all <ArrowRight aria-hidden="true" size={15} /></Link>}
                </div>
                <Surface className="p-2 sm:p-3" elevated>
                    <ActivityList
                        emptyMessage="Income, Expenses, and Transfers will appear here."
                        onSelect={setSelectedTransaction}
                        transactions={props.recentTransactions}
                    />
                </Surface>
            </section>

            {accountFormOpen && <AccountFormDrawer onClose={() => setAccountFormOpen(false)} />}
            {creatingType && <TransactionDrawer accounts={props.accounts} categories={props.categories} initialType={creatingType} onClose={() => setCreatingType(null)} today={props.today} />}
            {selectedTransaction && <TransactionDrawer accounts={props.accounts} categories={props.categories} onClose={() => setSelectedTransaction(null)} today={props.today} transaction={selectedTransaction} />}
        </div>
    );
}
