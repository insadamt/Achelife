import { router } from '@inertiajs/react';
import { CalendarClock, ChevronRight, CirclePause, History, Pencil, Play, Square, Trash2, WalletCards } from 'lucide-react';
import { useState } from 'react';

import { Button, StatusChip, Surface } from '../../components/ui';
import { classNames } from '../../components/ui/classNames';
import { MoneyCategoryIcon } from './MoneyCategoryIcon';
import { MoneyConfirmationDialog } from './MoneyConfirmationDialog';
import { MoneyDrawer } from './MoneyDrawer';
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
    const [detailsOpen, setDetailsOpen] = useState(false);
    const categoryLabel = `${subscription.category.name}${subscription.subcategory ? ` · ${subscription.subcategory.name}` : ''}`;

    function postLifecycle(action: 'pause' | 'resume' | 'end') {
        router.post(`/money/subscriptions/${subscription.id}/${action}`, {}, { preserveScroll: true, onSuccess: () => setDetailsOpen(false) });
    }

    function confirmLifecycle() {
        if (confirmation === 'delete') router.delete(`/money/subscriptions/${subscription.id}`, { preserveScroll: true });
        else if (confirmation === 'end') postLifecycle('end');
        setConfirmation(null);
    }

    function startEditing() {
        setDetailsOpen(false);
        onEdit();
    }

    function openOccurrence(occurrence: MoneySubscriptionOccurrenceData) {
        setDetailsOpen(false);
        onOccurrence(occurrence);
    }

    return (
        <>
            <Surface className="overflow-hidden" elevated>
                <button className="focus-ring group w-full p-4 text-left sm:p-5" onClick={() => setDetailsOpen(true)} type="button">
                    <span className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                        <MoneyCategoryIcon className="size-10" name={subscription.category.name} />
                        <span className="min-w-0">
                            <span className="flex min-w-0 items-center gap-2">
                                <span className="truncate font-bold">{subscription.name}</span>
                                {subscription.status !== 'active' && <span className={classNames('shrink-0 text-[0.65rem] font-bold uppercase', subscription.status === 'paused' ? 'text-muted' : 'text-success')}>{subscription.status}</span>}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-muted">{categoryLabel} · {subscription.paymentMode}</span>
                        </span>
                        <span className="flex items-center gap-2 pl-2">
                            <span className="text-right">
                                <strong className="block whitespace-nowrap text-lg tabular-nums">{formatMinorUnits(subscription.amountMinor, subscription.currency)}</strong>
                                <span className="mt-0.5 block whitespace-nowrap text-[0.65rem] text-muted">{subscription.nextPayment ? `Next ${formatMoneyDate(subscription.nextPayment)}` : 'No next payment'}</span>
                            </span>
                            <ChevronRight aria-hidden="true" className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5" size={17} />
                        </span>
                    </span>
                    <span className="mt-3 flex items-center gap-2 pl-13 text-xs text-secondary">
                        <CalendarClock aria-hidden="true" className="shrink-0 text-muted" size={14} />
                        <span className="truncate">{subscription.scheduleSentence}</span>
                    </span>
                </button>
            </Surface>

            <MoneyDrawer description={categoryLabel} onClose={() => setDetailsOpen(false)} open={detailsOpen} title={subscription.name}>
                <div className="rounded-[1.5rem] border border-border-subtle bg-app p-5">
                    <div className="flex flex-wrap items-center gap-2">
                        <StatusChip status={subscription.status === 'active' ? 'active' : subscription.status === 'paused' ? 'neutral' : 'completed'}>{subscription.status}</StatusChip>
                        <StatusChip status={subscription.paymentMode === 'automatic' ? 'active' : 'neutral'}>{subscription.paymentMode}</StatusChip>
                    </div>
                    <p className="mt-5 text-xs font-semibold text-muted">Recurring amount</p>
                    <p className="mt-1 text-4xl font-bold tracking-[-0.05em] tabular-nums">{formatMinorUnits(subscription.amountMinor, subscription.currency)}</p>
                    <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-secondary"><CalendarClock aria-hidden="true" className="text-muted" size={16} />{subscription.scheduleSentence}</p>
                </div>

                {subscription.status !== 'ended' && (
                    <div className="mt-4 grid gap-2">
                        <Button fullWidth onClick={startEditing}><Pencil aria-hidden="true" size={15} />Edit Subscription</Button>
                        <div className="grid grid-cols-2 gap-2">
                            {subscription.status === 'active' && <Button onClick={() => postLifecycle('pause')} variant="secondary"><CirclePause aria-hidden="true" size={15} />Pause</Button>}
                            {subscription.status === 'paused' && <Button onClick={() => postLifecycle('resume')} variant="secondary"><Play aria-hidden="true" size={15} />Resume</Button>}
                            <Button onClick={() => setConfirmation('end')} variant="ghost"><Square aria-hidden="true" size={15} />End</Button>
                        </div>
                    </div>
                )}

                <dl className="mt-6 divide-y divide-border-subtle text-sm">
                    <div className="flex items-center justify-between gap-4 py-3"><dt className="text-muted">Next payment</dt><dd className="font-semibold">{subscription.nextPayment ? formatMoneyDate(subscription.nextPayment) : 'None scheduled'}</dd></div>
                    <div className="flex items-center justify-between gap-4 py-3"><dt className="text-muted">Account</dt><dd className="flex items-center gap-2 text-right font-semibold"><WalletCards aria-hidden="true" className="text-muted" size={15} />{subscription.account.name}{subscription.account.archived ? ' · Archived' : ''}</dd></div>
                    <div className="flex items-center justify-between gap-4 py-3"><dt className="text-muted">Category</dt><dd className="text-right font-semibold">{categoryLabel}</dd></div>
                    {subscription.note && <div className="py-3"><dt className="text-muted">Note</dt><dd className="mt-1 whitespace-pre-wrap font-semibold">{subscription.note}</dd></div>}
                </dl>

                <section className="mt-6" aria-labelledby={`subscription-${subscription.id}-history`}>
                    <h3 className="flex items-center gap-2 text-sm font-bold" id={`subscription-${subscription.id}-history`}><History aria-hidden="true" className="text-muted" size={15} />Occurrence history</h3>
                    {subscription.occurrences.length === 0 ? <p className="mt-3 rounded-2xl border border-dashed border-border-strong p-4 text-center text-sm text-muted">No occurrences yet.</p> : (
                        <div className="mt-2 divide-y divide-border-subtle">
                            {subscription.occurrences.slice(0, 8).map((occurrence) => (
                                <button className="focus-ring flex min-h-14 w-full items-center justify-between gap-4 rounded-xl py-2 text-left" key={occurrence.id} onClick={() => openOccurrence(occurrence)} type="button">
                                    <span className="min-w-0"><span className="block font-semibold">{formatMoneyDate(occurrence.dueDate)}</span><span className="block text-xs text-muted">{occurrence.status}{occurrence.transactionId ? ` · Expense #${occurrence.transactionId}` : ''}</span></span>
                                    <span className="flex shrink-0 items-center gap-2"><strong className="tabular-nums">{formatMinorUnits(occurrence.amountMinor, occurrence.currency)}</strong><ChevronRight aria-hidden="true" className="text-muted" size={15} /></span>
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                {subscription.canDelete && <Button className="mt-6" fullWidth onClick={() => setConfirmation('delete')} variant="destructive"><Trash2 aria-hidden="true" size={15} />Delete Subscription</Button>}
            </MoneyDrawer>

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
            <Surface className="flex min-h-20 items-center justify-between gap-4 p-4 transition-colors hover:bg-surface-hover" elevated>
                <div className="flex min-w-0 items-center gap-3">
                    <span className={`grid size-10 shrink-0 place-items-center rounded-2xl ${occurrence.overdue ? 'bg-warning/10 text-warning' : 'bg-[color-mix(in_srgb,var(--money-accent)_11%,transparent)] text-accent-ink'}`}><CalendarClock aria-hidden="true" size={17} /></span>
                    <div className="min-w-0"><p className="truncate font-bold">{occurrence.subscriptionName}</p><p className="mt-1 truncate text-sm text-muted">{occurrence.overdue ? 'Overdue' : 'Due today'} · {formatMoneyDate(occurrence.dueDate)} · {occurrence.paymentMode}</p></div>
                </div>
                <span className="flex shrink-0 items-center gap-2"><strong className="text-lg tabular-nums">{formatMinorUnits(occurrence.amountMinor, occurrence.currency)}</strong><ChevronRight aria-hidden="true" className="text-muted" size={16} /></span>
            </Surface>
        </button>
    );
}
