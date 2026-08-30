import { router } from '@inertiajs/react';
import { CalendarClock, CirclePause, History, Pencil, Play, Square, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button, StatusChip, Surface } from '../../components/ui';
import { MoneyConfirmationDialog } from './MoneyConfirmationDialog';
import { formatMinorUnits, formatMoneyDate } from './moneyPresentation';
import type { MoneySubscriptionData, MoneySubscriptionOccurrenceData } from './types';

export function SubscriptionCard({
    onEdit,
    onOccurrence,
    subscription,
}: {
    onEdit: () => void;
    onOccurrence: (occurrence: MoneySubscriptionOccurrenceData) => void;
    subscription: MoneySubscriptionData;
}) {
    const [confirmation, setConfirmation] = useState<'end' | 'delete' | null>(null);

    function postLifecycle(action: 'pause' | 'resume' | 'end') {
        router.post(`/money/subscriptions/${subscription.id}/${action}`, {}, { preserveScroll: true });
    }

    function confirmLifecycle() {
        if (confirmation === 'delete') router.delete(`/money/subscriptions/${subscription.id}`, { preserveScroll: true });
        else if (confirmation === 'end') postLifecycle('end');
        setConfirmation(null);
    }

    return (
        <>
            <Surface className="overflow-hidden" elevated>
                <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-2xl font-bold tracking-[-0.03em]">{subscription.name}</h2>
                                <StatusChip status={subscription.status === 'active' ? 'active' : subscription.status === 'paused' ? 'neutral' : 'completed'}>{subscription.status}</StatusChip>
                                <StatusChip status={subscription.paymentMode === 'automatic' ? 'active' : 'neutral'}>{subscription.paymentMode}</StatusChip>
                            </div>
                            <p className="mt-2 text-sm text-secondary">{subscription.scheduleSentence}</p>
                        </div>
                        <p className="text-2xl font-bold tabular-nums">{formatMinorUnits(subscription.amountMinor, subscription.currency)}</p>
                    </div>

                    <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                        <div><dt className="text-muted">Next payment</dt><dd className="mt-1 font-bold">{subscription.nextPayment ? formatMoneyDate(subscription.nextPayment) : 'None scheduled'}</dd></div>
                        <div><dt className="text-muted">Account</dt><dd className="mt-1 font-bold">{subscription.account.name}{subscription.account.archived ? ' · Archived' : ''}</dd></div>
                        <div><dt className="text-muted">Category</dt><dd className="mt-1 font-bold">{subscription.category.name}{subscription.subcategory ? ` → ${subscription.subcategory.name}` : ''}</dd></div>
                    </dl>
                    {subscription.note && <p className="mt-4 whitespace-pre-wrap text-sm text-muted">{subscription.note}</p>}

                    <div className="mt-5 flex flex-wrap gap-2">
                        {subscription.status !== 'ended' && <Button onClick={onEdit} size="small" variant="secondary"><Pencil aria-hidden="true" size={15} />Edit</Button>}
                        {subscription.status === 'active' && <Button onClick={() => postLifecycle('pause')} size="small" variant="secondary"><CirclePause aria-hidden="true" size={15} />Pause</Button>}
                        {subscription.status === 'paused' && <Button onClick={() => postLifecycle('resume')} size="small" variant="secondary"><Play aria-hidden="true" size={15} />Resume</Button>}
                        {subscription.status !== 'ended' && <Button onClick={() => setConfirmation('end')} size="small" variant="secondary"><Square aria-hidden="true" size={15} />End</Button>}
                        {subscription.canDelete && <Button onClick={() => setConfirmation('delete')} size="small" variant="destructive"><Trash2 aria-hidden="true" size={15} />Delete</Button>}
                    </div>
                </div>

                {subscription.occurrences.length > 0 && (
                    <div className="border-t border-border-subtle bg-app/50 px-5 py-4 sm:px-6">
                        <h3 className="flex items-center gap-2 text-xs font-bold tracking-[0.15em] text-muted uppercase"><History aria-hidden="true" size={14} />Occurrence history</h3>
                        <div className="mt-2 divide-y divide-border-subtle">
                            {subscription.occurrences.slice(0, 8).map((occurrence) => (
                                <button className="focus-ring flex min-h-12 w-full items-center justify-between gap-4 rounded-xl py-2 text-left" key={occurrence.id} onClick={() => onOccurrence(occurrence)} type="button">
                                    <span className="min-w-0"><span className="block font-semibold">{formatMoneyDate(occurrence.dueDate)}</span><span className="block text-xs text-muted">{occurrence.status}{occurrence.transactionId ? ` · Expense #${occurrence.transactionId}` : ''}</span></span>
                                    <span className="shrink-0 font-bold tabular-nums">{formatMinorUnits(occurrence.amountMinor, occurrence.currency)}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </Surface>
            <MoneyConfirmationDialog
                confirmLabel={confirmation === 'delete' ? 'Delete Subscription' : 'End Subscription'}
                destructive={confirmation === 'delete'}
                description={confirmation === 'delete' ? 'Only unused definitions can be deleted.' : 'Future unresolved placeholders will be removed. Paid, skipped, and already-due history stays intact.'}
                onClose={() => setConfirmation(null)}
                onConfirm={confirmLifecycle}
                open={confirmation !== null}
                title={confirmation === 'delete' ? 'Delete this Subscription?' : 'End this Subscription?'}
            />
        </>
    );
}

export function DueOccurrenceCard({ occurrence, onOpen }: { occurrence: MoneySubscriptionOccurrenceData; onOpen: () => void }) {
    return (
        <button className="focus-ring w-full rounded-[1.5rem] text-left" onClick={onOpen} type="button">
            <Surface className="flex min-h-24 items-center justify-between gap-4 p-5 transition-colors hover:bg-surface-hover" elevated>
                <div className="min-w-0">
                    <p className="flex items-center gap-2 font-bold"><CalendarClock aria-hidden="true" size={17} />{occurrence.subscriptionName}</p>
                    <p className="mt-1 text-sm text-muted">{occurrence.overdue ? 'Overdue' : 'Due today'} · {formatMoneyDate(occurrence.dueDate)} · {occurrence.paymentMode}</p>
                </div>
                <strong className="shrink-0 text-lg tabular-nums">{formatMinorUnits(occurrence.amountMinor, occurrence.currency)}</strong>
            </Surface>
        </button>
    );
}
