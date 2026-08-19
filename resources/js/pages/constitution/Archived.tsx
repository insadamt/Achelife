import { Head, Link } from '@inertiajs/react';
import { Archive, CalendarDays, Hash, Scale, ShieldCheck } from 'lucide-react';
import type { CSSProperties } from 'react';

import { Surface } from '../../components/ui';
import { formatConstitutionDate, formatPenalty, severityLabels, severityStyles } from '../../features/constitution/constitutionPresentation';
import type { ArchivedLawViewData } from '../../features/constitution/types';

export default function ArchivedConstitution({ laws }: { laws: ArchivedLawViewData[] }) {
    return (
        <div style={{ '--module-accent': 'var(--constitution-accent)' } as CSSProperties}>
            <Head title="Archived Laws" />

            <div className="mx-auto max-w-6xl">
                <header className="mb-6">
                    <h1 className="text-4xl font-bold tracking-[-0.05em] sm:text-5xl">Constitution</h1>
                    <p className="mt-1 text-sm font-semibold text-muted">Archived Laws</p>
                </header>

                <nav aria-label="Constitution views" className="mb-5 flex items-center border-b border-border-subtle">
                    <Link className="focus-ring icon-text flex min-h-11 items-center gap-2 rounded-t-xl px-3 text-sm font-bold text-muted hover:bg-surface-hover hover:text-foreground" href="/constitution">
                        <ShieldCheck aria-hidden="true" size={17} />
                        Active
                    </Link>
                    <span aria-current="page" className="icon-text flex min-h-11 items-center gap-2 border-b-2 border-[var(--module-accent)] px-3 text-sm font-bold text-foreground">
                        <Archive aria-hidden="true" size={17} />
                        Archived
                        <span className="rounded-full bg-elevated px-2 py-0.5 text-xs text-secondary">{laws.length}</span>
                    </span>
                </nav>

                {laws.length === 0 ? (
                    <Surface className="grid min-h-56 place-items-center p-8 text-center" elevated>
                        <div>
                            <Archive className="mx-auto text-muted" size={32} />
                            <p className="mt-3 font-bold">No archived Laws</p>
                        </div>
                    </Surface>
                ) : (
                    <div className="space-y-2">
                        {laws.map((law) => {
                            const styles = severityStyles[law.severity];

                            return (
                                <Surface className={`border-l-2 p-4 ${styles.border}`} elevated key={law.id}>
                                    <div className="grid items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <span className={`grid size-11 shrink-0 place-items-center rounded-xl border ${styles.border} ${styles.background} ${styles.text}`}><Scale aria-hidden="true" size={19} /></span>
                                            <span className="min-w-0">
                                                <span className="block truncate text-lg font-bold">{law.name}</span>
                                                <span className={`text-xs font-bold ${styles.text}`}>{severityLabels[law.severity]} · {formatPenalty(law.basePenalty)} base</span>
                                            </span>
                                        </div>
                                        <span className="icon-text flex items-center gap-2 text-sm font-semibold text-muted"><Hash aria-hidden="true" size={15} />{law.violationCount} all-time</span>
                                        <span className="icon-text flex items-center gap-2 text-sm font-semibold text-muted"><CalendarDays aria-hidden="true" size={15} />{formatConstitutionDate(law.archivedAt.slice(0, 10))}</span>
                                    </div>
                                </Surface>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
