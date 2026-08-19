import { useForm } from '@inertiajs/react';
import { CircleAlert, Hash, RefreshCw, TrendingDown } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';

import { Button, Dialog, Field } from '../../components/ui';
import { formatPenalty, formatSpDelta, projectRecordedViolation, severityLabels, severityStyles } from './constitutionPresentation';
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
    const projection = projectRecordedViolation(law.basePenalty, form.data.date, law.violations);
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
        <Dialog onClose={onClose} open title="Record Violation">
            <form className="space-y-6" onSubmit={submit}>
                <div className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-app p-3">
                    <span className={`grid size-10 shrink-0 place-items-center rounded-xl border ${styles.border} ${styles.background} ${styles.text}`}>
                        <CircleAlert aria-hidden="true" size={18} />
                    </span>
                    <span className="min-w-0">
                        <span className="block truncate font-bold">{law.name}</span>
                        <span className={`text-xs font-bold ${styles.text}`}>{severityLabels[law.severity]} · {formatPenalty(law.basePenalty)} base</span>
                    </span>
                </div>

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

                <div className="grid grid-cols-2 gap-2">
                    <ImpactMetric icon={<Hash size={17} />} label="Sequence" value={`#${projection.sequence} · ×${projection.sequence}`} />
                    <ImpactMetric danger icon={<TrendingDown size={17} />} label="Violation" value={formatPenalty(projection.recordPenalty)} />
                    <ImpactMetric className="col-span-2" danger={projection.seasonAdjustment < 0} icon={<RefreshCw size={17} />} label="Season adjustment" value={formatSpDelta(projection.seasonAdjustment)} />
                </div>

                <Button disabled={form.processing} fullWidth type="submit" variant="destructive">
                    <CircleAlert aria-hidden="true" size={18} />
                    Record {formatPenalty(projection.recordPenalty)}
                </Button>
            </form>
        </Dialog>
    );
}

function ImpactMetric({ className = '', danger = false, icon, label, value }: {
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
