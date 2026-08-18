import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent } from 'react';

import { Button, Dialog, Drawer, Field } from '../../components/ui';
import { formatConstitutionDate, formatPenalty, severityLabels, severityStyles } from './constitutionPresentation';
import type { ConstitutionSeasonData, LawViewData, ViolationViewData } from './types';

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

    function submit(event: FormEvent) {
        event.preventDefault();
        form.put(`/constitution/violations/${violation.id}`, { preserveScroll: true, onSuccess: onClose });
    }

    return (
        <Dialog description="Changing the date may renumber this Law's current-Season violations and adjust Season SP." onClose={onClose} open title="Correct Violation Date">
            <form className="space-y-5" onSubmit={submit}>
                <Field error={form.errors.date} label="Date" max={today} min={earliestDate} onChange={(event) => form.setData('date', event.target.value)} required type="date" value={form.data.date} />
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
}: {
    law: LawViewData;
    season: ConstitutionSeasonData;
    today: string;
    onClose: () => void;
}) {
    const [editingViolation, setEditingViolation] = useState<ViolationViewData | null>(null);
    const [deletingViolation, setDeletingViolation] = useState<ViolationViewData | null>(null);
    const styles = severityStyles[law.severity];

    function deleteViolation() {
        if (!deletingViolation) {
            return;
        }

        router.delete(`/constitution/violations/${deletingViolation.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingViolation(null),
        });
    }

    return (
        <Drawer description={`${severityLabels[law.severity]} · ${formatPenalty(law.basePenalty)} base penalty`} onClose={onClose} open title={law.name}>
            <div className="flex items-center justify-between border-y border-border-subtle py-4">
                <div>
                    <p className="text-[0.625rem] font-bold tracking-[0.14em] text-muted uppercase">Current Season</p>
                    <p className="mt-1 font-bold">Season {String(season.number).padStart(2, '0')}</p>
                </div>
                <div className="text-right">
                    <p className="text-[0.625rem] font-bold tracking-[0.14em] text-muted uppercase">Next multiplier</p>
                    <p className={`mt-1 text-3xl font-bold ${styles.text}`}>×{law.nextMultiplier}</p>
                </div>
            </div>

            {law.violations.length === 0 ? (
                <div className="py-12 text-center">
                    <p className="text-xl font-bold">No violations this Season</p>
                    <p className="mt-2 text-sm text-secondary">Current-Season records will appear here.</p>
                </div>
            ) : (
                <div className="mt-5 space-y-2">
                    {law.violations.map((violation) => {
                        const violationStyles = severityStyles[violation.severity];

                        return (
                            <div className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-border-subtle bg-app p-3" key={violation.id}>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                        <span className="font-bold">{formatConstitutionDate(violation.date)}</span>
                                        <span className={`text-xl font-bold ${violationStyles.text}`}>×{violation.multiplier}</span>
                                        <span className={`font-bold ${violationStyles.text}`}>{formatPenalty(violation.penalty)}</span>
                                    </div>
                                    <p className="mt-1 text-xs text-muted">{severityLabels[violation.severity]} snapshot · base {formatPenalty(violation.basePenalty)}</p>
                                </div>
                                <div className="flex gap-1">
                                    <button aria-label={`Edit violation from ${violation.date}`} className="focus-ring rounded-xl px-2.5 py-2 text-xs font-bold text-secondary hover:bg-surface-hover hover:text-foreground" onClick={() => setEditingViolation(violation)} type="button">Edit</button>
                                    <button aria-label={`Delete violation from ${violation.date}`} className="focus-ring rounded-xl px-2.5 py-2 text-xs font-bold text-danger hover:bg-danger/10" onClick={() => setDeletingViolation(violation)} type="button">Delete</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {editingViolation && <CorrectViolationDialog law={law} onClose={() => setEditingViolation(null)} season={season} today={today} violation={editingViolation} />}
            <Dialog description="Later violations for this Law will be renumbered, and the exact Constitution delta will be returned to Season SP." onClose={() => setDeletingViolation(null)} open={deletingViolation !== null} title="Delete Violation?">
                <div className="flex gap-2">
                    <Button className="flex-1" onClick={() => setDeletingViolation(null)} variant="secondary">Cancel</Button>
                    <Button className="flex-1" onClick={deleteViolation} variant="destructive">Delete Violation</Button>
                </div>
            </Dialog>
        </Drawer>
    );
}
