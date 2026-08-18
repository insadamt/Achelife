import { Head, Link } from '@inertiajs/react';
import type { CSSProperties } from 'react';

import { Surface } from '../../components/ui';
import { formatConstitutionDate, formatPenalty, severityLabels, severityStyles } from '../../features/constitution/constitutionPresentation';
import type { ArchivedLawViewData } from '../../features/constitution/types';

export default function ArchivedConstitution({ laws }: { laws: ArchivedLawViewData[] }) {
    return (
        <div style={{ '--module-accent': 'var(--constitution-accent)' } as CSSProperties}>
            <Head title="Archived Laws" />
            <header className="mb-8">
                <Link className="focus-ring text-sm font-bold text-[var(--module-accent)] hover:underline" href="/constitution">← Active Laws</Link>
                <p className="mt-6 text-xs font-bold tracking-[0.2em] text-[var(--module-accent)] uppercase">Read-only history</p>
                <h1 className="mt-2 text-4xl font-bold tracking-[-0.05em] sm:text-6xl">Archived Laws</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-secondary">Archived Laws are permanently inactive. Their violation records and penalty snapshots remain preserved.</p>
            </header>

            {laws.length === 0 ? (
                <Surface className="p-8 text-center" elevated>
                    <p className="text-xl font-bold">No archived Laws</p>
                    <p className="mt-2 text-sm text-secondary">Laws you archive will remain available here.</p>
                </Surface>
            ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                    {laws.map((law) => {
                        const styles = severityStyles[law.severity];

                        return (
                            <Surface className={`border-l-2 p-5 ${styles.border}`} elevated key={law.id}>
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-2xl font-bold">{law.name}</h2>
                                        <p className={`mt-2 text-sm font-bold ${styles.text}`}>{severityLabels[law.severity]} · {formatPenalty(law.basePenalty)}</p>
                                    </div>
                                    <span className="rounded-full border border-border-strong px-3 py-1 text-[0.6rem] font-bold tracking-wider text-muted uppercase">Archived</span>
                                </div>
                                <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border-subtle pt-4 text-sm">
                                    <div><dt className="text-muted">Archived</dt><dd className="mt-1 font-bold">{formatConstitutionDate(law.archivedAt.slice(0, 10))}</dd></div>
                                    <div><dt className="text-muted">All-time violations</dt><dd className="mt-1 font-bold">{law.violationCount}</dd></div>
                                </dl>
                                <p className="mt-4 text-xs text-muted">Read-only. Long-term Constitution analytics remain reserved for Constitution Statistics.</p>
                            </Surface>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
