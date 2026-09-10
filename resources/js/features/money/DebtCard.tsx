import { router } from '@inertiajs/react';
import { CalendarDays, ChevronDown, ChevronUp, HandCoins, Trash2, UserRound } from 'lucide-react';
import { useState } from 'react';

import { Button, StatusChip, Surface } from '../../components/ui';
import { MoneyConfirmationDialog } from './MoneyConfirmationDialog';
import { formatMinorUnits, formatMoneyDate } from './moneyPresentation';
import type { MoneyDebtData, MoneyDebtSettlementData } from './types';

type Confirmation = { kind: 'forgive' | 'debt' } | { kind: 'settlement'; settlement: MoneyDebtSettlementData } | null;

export function DebtCard({ debt, onRepay }: { debt: MoneyDebtData; onRepay: () => void }) {
    const [expanded, setExpanded] = useState(false);
    const [confirmation, setConfirmation] = useState<Confirmation>(null);
    const repaidAmount = debt.settlements.filter((settlement) => settlement.type === 'repayment').reduce((sum, settlement) => sum + settlement.amountMinor, 0);
    const forgivenAmount = debt.settlements.filter((settlement) => settlement.type === 'forgiveness').reduce((sum, settlement) => sum + settlement.amountMinor, 0);
    const progress = Math.min(100, Math.round((debt.settledAmountMinor / debt.originalAmountMinor) * 100));

    function confirmAction() {
        if (confirmation?.kind === 'forgive') router.post(`/money/debts/${debt.id}/forgive`, {}, { preserveScroll: true, onSuccess: () => setConfirmation(null) });
        if (confirmation?.kind === 'debt') router.delete(`/money/debts/${debt.id}`, { preserveScroll: true, onSuccess: () => setConfirmation(null) });
        if (confirmation?.kind === 'settlement') router.delete(`/money/debt-settlements/${confirmation.settlement.id}`, { preserveScroll: true, onSuccess: () => setConfirmation(null) });
    }

    return (
        <Surface className="overflow-hidden" elevated>
            <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--money-accent)_12%,transparent)] text-accent-ink"><UserRound aria-hidden="true" size={19} /></span>
                        <div className="min-w-0">
                            <h2 className="truncate text-xl font-bold">{debt.person.name}</h2>
                            <p className="mt-0.5 text-sm text-muted">{debt.direction === 'payable' ? 'You owe' : 'Owes you'} · opened {formatMoneyDate(debt.openedOn)}</p>
                        </div>
                    </div>
                    <StatusChip status={debt.status === 'settled' ? 'completed' : debt.status === 'overdue' ? 'warning' : 'active'}>{debt.status}</StatusChip>
                </div>

                <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold tracking-[0.14em] text-muted uppercase">Remaining</p>
                        <p className="mt-1 text-3xl font-bold tracking-[-0.04em] tabular-nums">{formatMinorUnits(debt.remainingAmountMinor, debt.currency)}</p>
                        <p className="mt-1 text-sm text-muted">of {formatMinorUnits(debt.originalAmountMinor, debt.currency)}</p>
                    </div>
                    {debt.dueOn && <p className={`flex items-center gap-1.5 text-sm font-semibold ${debt.status === 'overdue' ? 'text-warning' : 'text-secondary'}`}><CalendarDays aria-hidden="true" size={15} />Due {formatMoneyDate(debt.dueOn)}</p>}
                </div>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-app"><div className="h-full rounded-full bg-[var(--money-accent)] transition-[width]" style={{ width: `${progress}%` }} /></div>

                {debt.status !== 'settled' && (
                    <div className="mt-6 flex flex-wrap gap-2">
                        <Button onClick={onRepay}><HandCoins aria-hidden="true" size={16} />Record repayment</Button>
                        <Button onClick={() => setConfirmation({ kind: 'forgive' })} variant="ghost">Forgive balance</Button>
                    </div>
                )}

                <button className="focus-ring mt-5 flex min-h-10 w-full items-center justify-between rounded-xl border-t border-border-subtle pt-4 text-sm font-bold text-secondary hover:text-foreground" onClick={() => setExpanded((value) => !value)} type="button">
                    Details and history
                    {expanded ? <ChevronUp aria-hidden="true" size={17} /> : <ChevronDown aria-hidden="true" size={17} />}
                </button>
            </div>

            {expanded && (
                <div className="border-t border-border-subtle bg-app/35 p-5 sm:p-6">
                    <dl className="grid gap-4 text-sm sm:grid-cols-2">
                        <div><dt className="text-muted">Initial movement</dt><dd className="mt-1 font-semibold">{debt.openingMovement ? debt.openingMovement.account.name : 'Track only · no Account movement'}</dd></div>
                        <div><dt className="text-muted">Repaid</dt><dd className="mt-1 font-semibold tabular-nums">{formatMinorUnits(repaidAmount, debt.currency)}</dd></div>
                        {forgivenAmount > 0 && <div><dt className="text-muted">Forgiven</dt><dd className="mt-1 font-semibold tabular-nums">{formatMinorUnits(forgivenAmount, debt.currency)}</dd></div>}
                        {debt.note && <div className="sm:col-span-2"><dt className="text-muted">Note</dt><dd className="mt-1 whitespace-pre-wrap font-semibold">{debt.note}</dd></div>}
                    </dl>

                    <div className="mt-6">
                        <p className="text-xs font-bold tracking-[0.14em] text-muted uppercase">Settlement history</p>
                        {debt.settlements.length === 0 ? <p className="mt-3 text-sm text-muted">No repayments or forgiveness recorded.</p> : (
                            <div className="mt-3 divide-y divide-border-subtle">
                                {debt.settlements.map((settlement) => (
                                    <div className="flex items-center justify-between gap-3 py-3" key={settlement.id}>
                                        <div className="min-w-0"><p className="font-semibold capitalize">{settlement.type}</p><p className="mt-0.5 truncate text-xs text-muted">{formatMoneyDate(settlement.settledOn)} · {settlement.account?.name ?? 'No Account movement'}{settlement.note ? ` · ${settlement.note}` : ''}</p></div>
                                        <div className="flex shrink-0 items-center gap-2"><strong className="tabular-nums">{formatMinorUnits(settlement.amountMinor, debt.currency)}</strong><button aria-label={`Delete ${settlement.type}`} className="focus-ring grid size-9 place-items-center rounded-full text-muted hover:bg-danger/10 hover:text-danger" onClick={() => setConfirmation({ kind: 'settlement', settlement })} type="button"><Trash2 aria-hidden="true" size={15} /></button></div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {debt.canDelete && <Button className="mt-5" onClick={() => setConfirmation({ kind: 'debt' })} variant="destructive"><Trash2 aria-hidden="true" size={16} />Delete debt</Button>}
                </div>
            )}

            <MoneyConfirmationDialog
                confirmLabel={confirmation?.kind === 'forgive' ? 'Forgive balance' : confirmation?.kind === 'debt' ? 'Delete debt' : 'Delete record'}
                destructive={confirmation?.kind !== 'forgive'}
                description={confirmation?.kind === 'forgive' ? `The remaining ${formatMinorUnits(debt.remainingAmountMinor, debt.currency)} will close as forgiven without moving Account money.` : confirmation?.kind === 'debt' ? 'The debt and its initial Account movement will be permanently removed.' : 'This settlement will be removed. Any linked Account movement will reverse, and the debt will reopen by that amount.'}
                onClose={() => setConfirmation(null)}
                onConfirm={confirmAction}
                open={confirmation !== null}
                title={confirmation?.kind === 'forgive' ? 'Forgive the remaining balance?' : confirmation?.kind === 'debt' ? 'Delete this debt?' : 'Delete this settlement?'}
            />
        </Surface>
    );
}
