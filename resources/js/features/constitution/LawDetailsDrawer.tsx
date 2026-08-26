import { router, useForm } from '@inertiajs/react';
import { Archive, CircleAlert, MoreHorizontal, Pencil, RefreshCw, Scale, Trash2, TrendingDown } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';

import { Button, Dialog, Drawer, Field } from '../../components/ui';
import {
    calculateLawSeasonPenalty,
    formatConstitutionDate,
    formatPenalty,
    formatSpDelta,
    projectCorrectedViolation,
    projectDeletedViolation,
    severityLabels,
    severityStyles,
} from './constitutionPresentation';
import type { ConstitutionSeasonData, LawViewData, ViolationViewData } from './types';

type LawConfirmation = 'archive' | 'delete' | null;

function CorrectViolationDialog({
    law,
    season,
    today,
    violation,
    onClose,
}: {
    law: LawViewData;
    season: ConstitutionSeasonData;
    today: string;
    violation: ViolationViewData;
    onClose: () => void;
}) {
    const form = useForm<{ date: string }>({ date: violation.date });
    const earliestDate = law.createdOn > season.startDate ? law.createdOn : season.startDate;
    const seasonAdjustment = projectCorrectedViolation(form.data.date, violation.id, law.violations);

    function submit(event: FormEvent) {
        event.preventDefault();
        form.put(`/constitution/violations/${violation.id}`, { preserveScroll: true, onSuccess: onClose });
    }

    return (
        <Dialog onClose={onClose} open title="Correct Date">
            <form className="space-y-5" onSubmit={submit}>
                <Field error={form.errors.date} label="Date" max={today} min={earliestDate} onChange={(event) => form.setData('date', event.target.value)} required type="date" value={form.data.date} />
                <AdjustmentPreview value={seasonAdjustment} />
                <Button disabled={form.processing} fullWidth type="submit">Save Date</Button>
            </form>
        </Dialog>
    );
}

export function LawDetailsDrawer({
    law,
    season,
    today,
    onClose,
    onEdit,
    onRecord,
    canRecord = true,
}: {
    law: LawViewData;
    season: ConstitutionSeasonData;
    today: string;
    onClose: () => void;
    onEdit: () => void;
    onRecord: () => void;
    canRecord?: boolean;
}) {
    const [editingViolation, setEditingViolation] = useState<ViolationViewData | null>(null);
    const [deletingViolation, setDeletingViolation] = useState<ViolationViewData | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [lawConfirmation, setLawConfirmation] = useState<LawConfirmation>(null);
    const seasonPenalty = Math.abs(calculateLawSeasonPenalty(law.violations));
    const deletionAdjustment = deletingViolation ? projectDeletedViolation(deletingViolation.id, law.violations) : 0;

    function deleteViolation() {
        if (!deletingViolation) return;

        router.delete(`/constitution/violations/${deletingViolation.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingViolation(null),
        });
    }

    function confirmLawLifecycle() {
        if (lawConfirmation === 'archive') {
            router.post(`/constitution/laws/${law.id}/archive`, {}, { preserveScroll: true, onSuccess: onClose });
        } else if (lawConfirmation === 'delete') {
            router.delete(`/constitution/laws/${law.id}`, { preserveScroll: true, onSuccess: onClose });
        }
    }

    return (
        <Drawer description={`${severityLabels[law.severity]} · ${formatPenalty(law.basePenalty)} base`} onClose={onClose} open title={law.name}>
            <div className="relative flex items-center gap-2">
                <Button className="flex-1" onClick={onEdit} variant="secondary">
                    <Pencil aria-hidden="true" size={16} />
                    Edit
                </Button>
                <button aria-expanded={menuOpen} aria-label="Law actions" className="focus-ring grid size-11 shrink-0 place-items-center rounded-full border border-border-strong bg-elevated text-muted hover:bg-surface-hover hover:text-foreground" onClick={() => setMenuOpen(!menuOpen)} type="button">
                    <MoreHorizontal aria-hidden="true" size={20} />
                </button>
                {menuOpen && (
                    <div className="absolute top-12 right-0 z-10 w-52 rounded-2xl border border-border-strong bg-elevated p-1.5 shadow-2xl">
                        <LifecycleAction icon={<Archive size={16} />} label="Archive Law" onClick={() => { setMenuOpen(false); setLawConfirmation('archive'); }} />
                        {law.canDelete && <LifecycleAction destructive icon={<Trash2 size={16} />} label="Delete Law" onClick={() => { setMenuOpen(false); setLawConfirmation('delete'); }} />}
                    </div>
                )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
                <DrawerMetric icon={<CircleAlert size={17} />} label="This Season" value={law.currentSeasonViolationCount.toLocaleString()} />
                <DrawerMetric danger icon={<TrendingDown size={17} />} label="SP lost" value={seasonPenalty === 0 ? '0 SP' : `-${seasonPenalty.toLocaleString()} SP`} />
                <DrawerMetric className="col-span-2" icon={<Scale size={17} />} label="Next violation" value={`${formatPenalty(law.nextPenalty)} · ×${law.nextMultiplier}`} />
            </div>

            <Button className="mt-4" disabled={!canRecord} fullWidth onClick={onRecord} variant="destructive">
                <CircleAlert aria-hidden="true" size={18} />
                Record {formatPenalty(law.nextPenalty)}
            </Button>

            {law.violations.length === 0 ? (
                <div className="py-12 text-center">
                    <Scale className="mx-auto text-muted" size={30} />
                    <p className="mt-3 font-bold">No violations this Season</p>
                </div>
            ) : (
                <ol className="mt-6 space-y-2">
                    {law.violations.map((violation) => {
                        const violationStyles = severityStyles[violation.severity];

                        return (
                            <li className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-border-subtle bg-app p-3" key={violation.id}>
                                <span className={`grid size-10 place-items-center rounded-xl border text-sm font-bold ${violationStyles.border} ${violationStyles.background} ${violationStyles.text}`}>#{violation.multiplier}</span>
                                <span className="min-w-0">
                                    <span className="block font-bold">{formatConstitutionDate(violation.date)}</span>
                                    <span className="mt-0.5 block text-xs font-semibold text-muted">{severityLabels[violation.severity]} · {formatPenalty(violation.basePenalty)} base</span>
                                </span>
                                <span className="text-right">
                                    <span className={`block font-bold ${violationStyles.text}`}>{formatPenalty(violation.penalty)}</span>
                                    <span className="mt-1 flex justify-end gap-1">
                                        <button aria-label={`Correct violation from ${violation.date}`} className="focus-ring grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-hover hover:text-foreground" onClick={() => setEditingViolation(violation)} type="button"><Pencil aria-hidden="true" size={14} /></button>
                                        <button aria-label={`Delete violation from ${violation.date}`} className="focus-ring grid size-8 place-items-center rounded-lg text-danger hover:bg-danger/10" onClick={() => setDeletingViolation(violation)} type="button"><Trash2 aria-hidden="true" size={14} /></button>
                                    </span>
                                </span>
                            </li>
                        );
                    })}
                </ol>
            )}

            {editingViolation && <CorrectViolationDialog law={law} onClose={() => setEditingViolation(null)} season={season} today={today} violation={editingViolation} />}

            <Dialog onClose={() => setDeletingViolation(null)} open={deletingViolation !== null} title="Delete Violation?">
                <AdjustmentPreview value={deletionAdjustment} />
                <div className="mt-5 flex gap-2">
                    <Button className="flex-1" onClick={() => setDeletingViolation(null)} variant="secondary">Cancel</Button>
                    <Button className="flex-1" onClick={deleteViolation} variant="destructive"><Trash2 aria-hidden="true" size={16} />Delete</Button>
                </div>
            </Dialog>

            <Dialog onClose={() => setLawConfirmation(null)} open={lawConfirmation !== null} title={lawConfirmation === 'delete' ? 'Delete Law?' : 'Archive Law?'}>
                <p className="text-sm leading-6 text-secondary">
                    {lawConfirmation === 'delete' ? 'This Law has no violation history.' : 'Archived Laws cannot be reactivated.'}
                </p>
                <div className="mt-5 flex gap-2">
                    <Button className="flex-1" onClick={() => setLawConfirmation(null)} variant="secondary">Cancel</Button>
                    <Button className="flex-1" onClick={confirmLawLifecycle} variant="destructive">
                        {lawConfirmation === 'delete' ? <Trash2 aria-hidden="true" size={16} /> : <Archive aria-hidden="true" size={16} />}
                        {lawConfirmation === 'delete' ? 'Delete' : 'Archive'}
                    </Button>
                </div>
            </Dialog>
        </Drawer>
    );
}

function AdjustmentPreview({ value }: { value: number }) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-border-subtle bg-app p-4">
            <span className="icon-text flex items-center gap-2 text-xs font-bold tracking-[0.1em] text-muted uppercase"><RefreshCw aria-hidden="true" size={15} />Season adjustment</span>
            <span className={`text-lg font-bold ${value < 0 ? 'text-danger' : value > 0 ? 'text-success' : 'text-secondary'}`}>{formatSpDelta(value)}</span>
        </div>
    );
}

function DrawerMetric({ className = '', danger = false, icon, label, value }: {
    className?: string;
    danger?: boolean;
    icon: ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className={`flex items-center gap-3 rounded-2xl border border-border-subtle bg-app p-3 ${className}`}>
            <span className={`grid size-9 shrink-0 place-items-center rounded-xl bg-elevated ${danger ? 'text-danger' : 'text-[var(--module-accent)]'}`}>{icon}</span>
            <span>
                <span className="block text-[0.625rem] font-bold tracking-[0.12em] text-muted uppercase">{label}</span>
                <span className={`mt-0.5 block font-bold ${danger ? 'text-danger' : 'text-foreground'}`}>{value}</span>
            </span>
        </div>
    );
}

function LifecycleAction({ destructive = false, icon, label, onClick }: {
    destructive?: boolean;
    icon: ReactNode;
    label: string;
    onClick: () => void;
}) {
    return (
        <button className={`focus-ring icon-text flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-semibold hover:bg-surface-hover ${destructive ? 'text-danger' : 'text-secondary'}`} onClick={onClick} type="button">
            {icon}
            {label}
        </button>
    );
}
