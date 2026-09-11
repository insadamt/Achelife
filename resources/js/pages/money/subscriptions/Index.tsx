import { Head, Link } from '@inertiajs/react';
import { CalendarClock } from 'lucide-react';
import { useState } from 'react';
import type { CSSProperties } from 'react';

import { Surface } from '../../../components/ui';
import { MoneyFloatingActionMenu } from '../../../features/money/MoneyFloatingActionMenu';
import { MoneyPageHeader } from '../../../features/money/MoneyPageHeader';
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
    const [composerOpen, setComposerOpen] = useState(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('create') === '1');
    const [editing, setEditing] = useState<MoneySubscriptionData | null>(null);
    const [occurrence, setOccurrence] = useState<MoneySubscriptionOccurrenceData | null>(null);

    return (
        <div style={moduleStyle}>
            <Head title="Money Subscriptions" />
            <MoneyPageHeader active="subscriptions" description="Stay ahead of recurring costs with deliberate manual payments or automatic Expense recording." title="Subscriptions" />

            <Surface className="mb-6 grid grid-cols-2 divide-x divide-border-subtle p-4" elevated>
                <div><p className="text-xs text-muted">Active</p><p className="mt-1 text-2xl font-bold tabular-nums">{props.counts.active}</p></div>
                <div className="pl-4"><p className="text-xs text-muted">Needs attention</p><p className={`mt-1 text-2xl font-bold tabular-nums ${props.counts.due > 0 ? 'text-warning' : ''}`}>{props.counts.due}</p></div>
            </Surface>

            <nav aria-label="Subscription views" className="mb-6 flex max-w-full gap-1 overflow-x-auto border-b border-border-subtle">
                {views.map((item) => <Link aria-current={props.view === item.value ? 'page' : undefined} className={`focus-ring shrink-0 border-b-2 px-3 py-3 text-sm font-bold ${props.view === item.value ? 'border-[var(--money-accent)] text-foreground' : 'border-transparent text-muted hover:text-foreground'}`} href={`/money/subscriptions?view=${item.value}`} key={item.value}>{item.label} <span className="ml-1 text-xs">{props.counts[item.value]}</span></Link>)}
            </nav>

            {props.view === 'due' ? (
                <div className="grid gap-3">
                    {props.dueOccurrences.map((item) => <DueOccurrenceCard key={item.id} occurrence={item} onOpen={() => setOccurrence(item)} />)}
                </div>
            ) : (
                <div className="grid gap-3">
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
            {!composerOpen && !editing && !occurrence && <MoneyFloatingActionMenu actions={[{ icon: CalendarClock, label: 'New subscription', onSelect: () => setComposerOpen(true) }]} />}
        </div>
    );
}
