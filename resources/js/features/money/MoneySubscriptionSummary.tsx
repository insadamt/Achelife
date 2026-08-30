import { Link } from '@inertiajs/react';
import { ArrowRight, CalendarClock } from 'lucide-react';

import { Surface } from '../../components/ui';
import { formatMinorUnits, formatMoneyDate } from './moneyPresentation';
import type { MoneySubscriptionOccurrenceData } from './types';

export function MoneySubscriptionSummary({
    due,
    upcoming = [],
    title = 'Subscriptions',
}: {
    due: MoneySubscriptionOccurrenceData[];
    upcoming?: MoneySubscriptionOccurrenceData[];
    title?: string;
}) {
    if (due.length === 0 && upcoming.length === 0) return null;

    return (
        <section className="mt-8" aria-labelledby="subscription-summary-title">
            <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-sm font-bold tracking-[0.16em] text-secondary uppercase" id="subscription-summary-title">
                    <CalendarClock aria-hidden="true" size={17} /> {title}
                </h2>
                <Link className="flex items-center gap-1 text-sm font-bold text-[var(--money-accent,var(--accent))] hover:underline" href="/money/subscriptions?view=due">
                    Manage <ArrowRight aria-hidden="true" size={14} />
                </Link>
            </div>
            <Surface className="divide-y divide-border-subtle px-4" elevated>
                {due.slice(0, 4).map((occurrence) => <SummaryRow key={occurrence.id} occurrence={occurrence} />)}
                {upcoming.slice(0, Math.max(0, 4 - due.length)).map((occurrence) => <SummaryRow key={occurrence.id} occurrence={occurrence} upcoming />)}
            </Surface>
        </section>
    );
}

function SummaryRow({ occurrence, upcoming = false }: { occurrence: MoneySubscriptionOccurrenceData; upcoming?: boolean }) {
    return (
        <Link className="focus-ring flex min-h-16 items-center justify-between gap-4 rounded-xl py-3" href={`/money/subscriptions?view=${upcoming ? 'active' : 'due'}`}>
            <div className="min-w-0">
                <p className="truncate font-bold">{occurrence.subscriptionName}</p>
                <p className="text-xs text-muted">{upcoming ? 'Upcoming' : occurrence.overdue ? 'Overdue' : 'Due today'} · {formatMoneyDate(occurrence.dueDate)}</p>
            </div>
            <strong className="shrink-0 tabular-nums">{formatMinorUnits(occurrence.amountMinor, occurrence.currency)}</strong>
        </Link>
    );
}
