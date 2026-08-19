import { ChevronRight, CircleAlert, Hash, Scale } from 'lucide-react';

import { Button, Surface } from '../../components/ui';
import { calculateLawSeasonPenalty, formatPenalty, severityLabels, severityStyles } from './constitutionPresentation';
import type { LawViewData } from './types';

export function LawCard({
    law,
    onDetails,
    onRecord,
}: {
    law: LawViewData;
    onDetails: () => void;
    onRecord: () => void;
}) {
    const styles = severityStyles[law.severity];
    const seasonPenalty = Math.abs(calculateLawSeasonPenalty(law.violations));

    return (
        <Surface className={`border-l-2 p-3 sm:p-4 ${styles.border}`} elevated>
            <div className="grid items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                <button className="focus-ring flex min-w-0 items-center gap-3 rounded-xl text-left" onClick={onDetails} type="button">
                    <span className={`grid size-11 shrink-0 place-items-center rounded-xl border ${styles.border} ${styles.background} ${styles.text}`}>
                        <Scale aria-hidden="true" size={19} />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="flex min-w-0 items-center gap-2">
                            <span className="truncate text-lg font-bold text-foreground">{law.name}</span>
                            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.6rem] font-bold tracking-[0.1em] uppercase ${styles.text} ${styles.border} ${styles.background}`}>
                                {severityLabels[law.severity]}
                            </span>
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-muted">
                            <span className="icon-text inline-flex items-center gap-1"><Hash aria-hidden="true" size={13} />{law.currentSeasonViolationCount} this Season</span>
                            {seasonPenalty > 0 && <span className="text-danger">-{seasonPenalty.toLocaleString()} SP</span>}
                        </span>
                    </span>
                    <ChevronRight aria-hidden="true" className="shrink-0 text-muted sm:hidden" size={18} />
                </button>

                <div className="flex items-center justify-between gap-5 rounded-xl border border-border-subtle bg-app px-3 py-2.5 sm:min-w-44">
                    <span>
                        <span className="block text-[0.625rem] font-bold tracking-[0.12em] text-muted uppercase">Next</span>
                        <span className={`mt-0.5 block text-lg font-bold ${styles.text}`}>{formatPenalty(law.nextPenalty)}</span>
                    </span>
                    <span className={`text-sm font-bold ${styles.text}`}>×{law.nextMultiplier}</span>
                </div>

                <Button onClick={onRecord} variant="destructive">
                    <CircleAlert aria-hidden="true" size={17} />
                    Record
                </Button>
            </div>
        </Surface>
    );
}
