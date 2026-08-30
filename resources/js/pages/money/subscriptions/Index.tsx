import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import type { CSSProperties } from 'react';

import { Button, Surface } from '../../../components/ui';
import { MoneySectionNav } from '../../../features/money/MoneySectionNav';
import { DueOccurrenceCard, SubscriptionCard } from '../../../features/money/SubscriptionCard';
import { SubscriptionComposerDrawer } from '../../../features/money/SubscriptionComposerDrawer';
import { SubscriptionOccurrenceDrawer } from '../../../features/money/SubscriptionOccurrenceDrawer';
import type { MoneyAccountData, MoneyCategoryData, MoneySubscriptionData, MoneySubscriptionOccurrenceData } from '../../../features/money/types';

type SubscriptionView = 'active' | 'due' | 'paused' | 'ended';

interface SubscriptionPageProps {
    today: string;
    view: SubscriptionView;
    subscriptions: MoneySubscriptionData[];
    dueOccurrences: MoneySubscriptionOccurrenceData[];
    counts: Record<SubscriptionView, number>;
    accounts: MoneyAccountData[];
    categories: MoneyCategoryData[];
}

const moduleStyle = { '--module-accent': 'var(--money-accent)' } as CSSProperties;
const views: Array<{ label: string; value: SubscriptionView }> = [
    { label: 'Active', value: 'active' },
    { label: 'Due', value: 'due' },
    { label: 'Paused', value: 'paused' },
    { label: 'Ended', value: 'ended' },
];

export default function SubscriptionIndex(props: SubscriptionPageProps) {
    const [composerOpen, setComposerOpen] = useState(false);
    const [editing, setEditing] = useState<MoneySubscriptionData | null>(null);
    const [occurrence, setOccurrence] = useState<MoneySubscriptionOccurrenceData | null>(null);

    return (
        <div style={moduleStyle}>
            <Head title="Money Subscriptions" />
            <header className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <div>
                    <h1 className="text-4xl font-bold tracking-[-0.05em] sm:text-6xl">Subscriptions</h1>
                    <p className="mt-2 max-w-2xl text-secondary">Recurring bookkeeping with deliberate manual payments or automatic Expense recording.</p>
                </div>
                <MoneySectionNav active="subscriptions" />
            </header>

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <nav aria-label="Subscription views" className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-border-subtle bg-surface p-1">
                    {views.map((item) => <Link aria-current={props.view === item.value ? 'page' : undefined} className={`focus-ring shrink-0 rounded-full px-4 py-2 text-sm font-bold ${props.view === item.value ? 'bg-elevated shadow-sm' : 'text-muted hover:text-foreground'}`} href={`/money/subscriptions?view=${item.value}`} key={item.value}>{item.label} <span className="ml-1 text-xs">{props.counts[item.value]}</span></Link>)}
                </nav>
                <Button disabled={props.accounts.every((account) => account.archivedAt !== null) || props.categories.every((category) => category.archivedAt !== null)} onClick={() => setComposerOpen(true)}><Plus aria-hidden="true" size={17} />Subscription</Button>
            </div>

            {props.view === 'due' ? (
                <div className="grid gap-3 lg:grid-cols-2">
                    {props.dueOccurrences.map((item) => <DueOccurrenceCard key={item.id} occurrence={item} onOpen={() => setOccurrence(item)} />)}
                </div>
            ) : (
                <div className="grid gap-5 xl:grid-cols-2">
                    {props.subscriptions.map((subscription) => <SubscriptionCard key={subscription.id} onEdit={() => setEditing(subscription)} onOccurrence={setOccurrence} subscription={subscription} />)}
                </div>
            )}

            {((props.view === 'due' && props.dueOccurrences.length === 0) || (props.view !== 'due' && props.subscriptions.length === 0)) && (
                <Surface className="grid min-h-64 place-items-center p-8 text-center" elevated>
                    <div><p className="text-2xl font-bold">Nothing in {props.view}</p><p className="mt-2 text-muted">Your Subscription timeline is clear here.</p></div>
                </Surface>
            )}

            {(composerOpen || editing) && <SubscriptionComposerDrawer accounts={props.accounts} categories={props.categories} onClose={() => { setComposerOpen(false); setEditing(null); }} subscription={editing} today={props.today} />}
            {occurrence && <SubscriptionOccurrenceDrawer accounts={props.accounts} categories={props.categories} occurrence={occurrence} onClose={() => setOccurrence(null)} />}
        </div>
    );
}
