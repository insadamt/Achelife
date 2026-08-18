import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

import { Button, Dialog, Field } from '../../components/ui';
import { formatPenalty, severityStyles } from './constitutionPresentation';
import type { ConstitutionSeasonData, LawViewData } from './types';

interface ViolationFormPayload {
    date: string;
}

export function RecordViolationDialog({
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
    const form = useForm<ViolationFormPayload>({ date: today });
    const multiplier = law.violations.filter((violation) => violation.date <= form.data.date).length + 1;
    const penalty = law.basePenalty * multiplier;
    const earliestDate = law.createdOn > season.startDate ? law.createdOn : season.startDate;
    const styles = severityStyles[law.severity];

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post(`/constitution/laws/${law.id}/violations`, {
            preserveScroll: true,
            onSuccess: onClose,
        });
    }

    return (
        <Dialog description={law.name} onClose={onClose} open title="Record Violation">
            <form className="space-y-6" onSubmit={submit}>
                <Field
                    error={form.errors.date}
                    label="Date"
                    max={today}
                    min={earliestDate}
                    onChange={(event) => form.setData('date', event.target.value)}
                    required
                    type="date"
                    value={form.data.date}
                />

                <div className={`rounded-2xl border p-4 ${styles.border} ${styles.background}`}>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-[0.625rem] font-bold tracking-[0.14em] text-muted uppercase">Violation</p>
                            <p className="mt-1 text-2xl font-bold">#{multiplier}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[0.625rem] font-bold tracking-[0.14em] text-muted uppercase">Multiplier</p>
                            <p className={`mt-1 text-3xl font-bold ${styles.text}`}>×{multiplier}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[0.625rem] font-bold tracking-[0.14em] text-muted uppercase">Penalty</p>
                            <p className={`mt-1 text-2xl font-bold ${styles.text}`}>{formatPenalty(penalty)}</p>
                        </div>
                    </div>
                </div>

                <p className="text-xs leading-5 text-muted">Backdated records may renumber later violations. The saved Season SP delta is calculated by the server.</p>

                <Button disabled={form.processing} fullWidth type="submit">Record Violation</Button>
            </form>
        </Dialog>
    );
}
