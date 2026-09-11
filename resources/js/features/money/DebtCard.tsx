import { router } from '@inertiajs/react';
import { CalendarDays, ChevronRight, HandCoins, Trash2, UserRound, WalletCards } from 'lucide-react';
import { useState } from 'react';

import { Button, StatusChip, Surface } from '../../components/ui';
import { classNames } from '../../components/ui/classNames';
import { MoneyConfirmationDialog } from './MoneyConfirmationDialog';
import { MoneyDrawer } from './MoneyDrawer';
import { formatMinorUnits, formatMoneyDate } from './moneyPresentation';
import type { MoneyDebtData, MoneyDebtSettlementData } from './types';

type Confirmation = { kind: 'forgive' | 'debt' } | { kind: 'settlement'; settlement: MoneyDebtSettlementData } | null;

export function DebtCard({ debt, onRepay }: { debt: MoneyDebtData; onRepay: () => void }) {
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [confirmation, setConfirmation] = useState<Confirmation>(null);
    const repaidAmount = debt.settlements.filter((settlement) => settlement.type === 'repayment').reduce((sum, settlement) => sum + settlement.amountMinor, 0);
    const forgivenAmount = debt.settlements.filter((settlement) => settlement.type === 'forgiveness').reduce((sum, settlement) => sum + settlement.amountMinor, 0);
    const progress = Math.min(100, Math.round((debt.settledAmountMinor / debt.originalAmountMinor) * 100));
    const directionLabel = debt.direction === 'payable' ? 'You owe' : 'Owes you';

    function confirmAction() {
        if (confirmation?.kind === 'forgive') router.post(`/money/debts/${debt.id}/forgive`, {}, { preserveScroll: true, onSuccess: () => setConfirmation(null) });
        if (confirmation?.kind === 'debt') router.delete(`/money/debts/${debt.id}`, { preserveScroll: true, onSuccess: () => setConfirmation(null) });
        if (confirmation?.kind === 'settlement') router.delete(`/money/debt-settlements/${confirmation.settlement.id}`, { preserveScroll: true, onSuccess: () => setConfirmation(null) });
    }

    function startRepayment() {
        setDetailsOpen(false);
        onRepay();
    }

    return (
        <>
            <Surface className="overflow-hidden" elevated>
                <button className="focus-ring group w-full p-4 text-left sm:p-5" onClick={() => setDetailsOpen(true)} type="button">
                    <span className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                        <span className={classNames(
                            'grid size-10 shrink-0 place-items-center rounded-2xl',
                            debt.direction === 'receivable' ? 'bg-success/10 text-success' : 'bg-[color-mix(in_srgb,var(--money-accent)_11%,transparent)] text-accent-ink',
                        )}>
                            <UserRound aria-hidden="true" size={18} />
                        </span>
                        <span className="min-w-0">
                            <span className="flex min-w-0 items-center gap-2">
                                <span className="truncate font-bold">{debt.person.name}</span>
                                {debt.status === 'overdue' && <span className="shrink-0 text-[0.65rem] font-bold text-warning uppercase">Overdue</span>}
                                {debt.status === 'settled' && <span className="shrink-0 text-[0.65rem] font-bold text-success uppercase">Settled</span>}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-muted">{directionLabel}{debt.dueOn ? ` · Due ${formatMoneyDate(debt.dueOn)}` : ' · No due date'}</span>
                        </span>
                        <span className="flex items-center gap-2 pl-2">
                            <span className="text-right">
                                <strong className={classNames('block whitespace-nowrap text-lg tabular-nums', debt.direction === 'receivable' && debt.status !== 'settled' ? 'text-success' : 'text-foreground')}>{formatMinorUnits(debt.remainingAmountMinor, debt.currency)}</strong>
                                <span className="mt-0.5 block text-[0.65rem] text-muted">remaining</span>
                            </span>
                            <ChevronRight aria-hidden="true" className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5" size={17} />
                        </span>
                    </span>
                    <span className="mt-3 flex items-center gap-3 pl-13">
                        <span className="h-1 flex-1 overflow-hidden rounded-full bg-app"><span className="block h-full rounded-full bg-[var(--money-accent)]" style={{ width: `${progress}%` }} /></span>
                        <span className="shrink-0 text-[0.65rem] font-semibold text-muted">{progress}% settled</span>
                    </span>
                </button>
            </Surface>

            <MoneyDrawer description={`${directionLabel} · opened ${formatMoneyDate(debt.openedOn)}`} onClose={() => setDetailsOpen(false)} open={detailsOpen} title={debt.person.name}>
                <div className="rounded-[1.5rem] border border-border-subtle bg-app p-5">
                    <div className="flex items-center justify-between gap-3">
                        <StatusChip status={debt.status === 'settled' ? 'completed' : debt.status === 'overdue' ? 'warning' : 'active'}>{debt.status}</StatusChip>
                        {debt.dueOn && <p className={classNames('flex items-center gap-1.5 text-sm font-semibold', debt.status === 'overdue' ? 'text-warning' : 'text-muted')}><CalendarDays aria-hidden="true" size={15} />Due {formatMoneyDate(debt.dueOn)}</p>}
                    </div>
                    <p className="mt-5 text-xs font-semibold text-muted">Remaining balance</p>
                    <p className="mt-1 text-4xl font-bold tracking-[-0.05em] tabular-nums">{formatMinorUnits(debt.remainingAmountMinor, debt.currency)}</p>
                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-hover"><div className="h-full rounded-full bg-[var(--money-accent)]" style={{ width: `${progress}%` }} /></div>
                    <div className="mt-2 flex justify-between text-xs text-muted"><span>{progress}% settled</span><span>Original {formatMinorUnits(debt.originalAmountMinor, debt.currency)}</span></div>
                </div>

                {debt.status !== 'settled' && (
                    <div className="mt-4 grid gap-2">
                        <Button fullWidth onClick={startRepayment}><HandCoins aria-hidden="true" size={16} />Record repayment</Button>
                        <Button fullWidth onClick={() => setConfirmation({ kind: 'forgive' })} variant="ghost">Forgive remaining balance</Button>
                    </div>
                )}

                <dl className="mt-6 divide-y divide-border-subtle text-sm">
                    <div className="flex items-center justify-between gap-4 py-3"><dt className="text-muted">Initial Account</dt><dd className="flex items-center gap-2 text-right font-semibold"><WalletCards aria-hidden="true" className="text-muted" size={15} />{debt.openingMovement ? debt.openingMovement.account.name : 'Legacy record'}</dd></div>
                    <div className="flex items-center justify-between gap-4 py-3"><dt className="text-muted">Repaid</dt><dd className="font-semibold tabular-nums">{formatMinorUnits(repaidAmount, debt.currency)}</dd></div>
                    {forgivenAmount > 0 && <div className="flex items-center justify-between gap-4 py-3"><dt className="text-muted">Forgiven</dt><dd className="font-semibold tabular-nums">{formatMinorUnits(forgivenAmount, debt.currency)}</dd></div>}
                    {debt.note && <div className="py-3"><dt className="text-muted">Note</dt><dd className="mt-1 whitespace-pre-wrap font-semibold">{debt.note}</dd></div>}
                </dl>

                <section className="mt-6" aria-labelledby={`debt-${debt.id}-history`}>
                    <h3 className="text-sm font-bold" id={`debt-${debt.id}-history`}>Settlement history</h3>
                    {debt.settlements.length === 0 ? <p className="mt-3 rounded-2xl border border-dashed border-border-strong p-4 text-center text-sm text-muted">No repayments or forgiveness recorded.</p> : (
                        <div className="mt-2 divide-y divide-border-subtle">
                            {debt.settlements.map((settlement) => (
                                <div className="flex items-center justify-between gap-3 py-3" key={settlement.id}>
                                    <div className="min-w-0"><p className="font-semibold capitalize">{settlement.type}</p><p className="mt-0.5 truncate text-xs text-muted">{formatMoneyDate(settlement.settledOn)} · {settlement.account?.name ?? (settlement.type === 'forgiveness' ? 'No money moved' : 'Legacy record')}{settlement.note ? ` · ${settlement.note}` : ''}</p></div>
                                    <div className="flex shrink-0 items-center gap-2"><strong className="tabular-nums">{formatMinorUnits(settlement.amountMinor, debt.currency)}</strong><button aria-label={`Delete ${settlement.type}`} className="focus-ring grid size-9 place-items-center rounded-full text-muted hover:bg-danger/10 hover:text-danger" onClick={() => setConfirmation({ kind: 'settlement', settlement })} type="button"><Trash2 aria-hidden="true" size={15} /></button></div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {debt.canDelete && <Button className="mt-6" fullWidth onClick={() => setConfirmation({ kind: 'debt' })} variant="destructive"><Trash2 aria-hidden="true" size={16} />Delete debt</Button>}
            </MoneyDrawer>

            <MoneyConfirmationDialog
                confirmLabel={confirmation?.kind === 'forgive' ? 'Forgive balance' : confirmation?.kind === 'debt' ? 'Delete debt' : 'Delete record'}
                destructive={confirmation?.kind !== 'forgive'}
                description={confirmation?.kind === 'forgive' ? `The remaining ${formatMinorUnits(debt.remainingAmountMinor, debt.currency)} will close as forgiven without moving Account money.` : confirmation?.kind === 'debt' ? 'The debt and its initial Account movement will be permanently removed.' : 'This settlement will be removed. Any linked Account movement will reverse, and the debt will reopen by that amount.'}
                onClose={() => setConfirmation(null)}
                onConfirm={confirmAction}
                open={confirmation !== null}
                title={confirmation?.kind === 'forgive' ? 'Forgive the remaining balance?' : confirmation?.kind === 'debt' ? 'Delete this debt?' : 'Delete this settlement?'}
            />
        </>
    );
}
