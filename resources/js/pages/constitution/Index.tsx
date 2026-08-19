import { Head, Link, router } from '@inertiajs/react';
import { Archive, CircleAlert, Plus, Scale, ShieldCheck, TrendingDown, Undo2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

import { Button, Surface } from '../../components/ui';
import { LawCard } from '../../features/constitution/LawCard';
import { LawDetailsDrawer } from '../../features/constitution/LawDetailsDrawer';
import { LawFormDrawer } from '../../features/constitution/LawFormDrawer';
import { RecordViolationDialog } from '../../features/constitution/RecordViolationDialog';
import type { ConstitutionSeasonData, LawViewData, RecordedViolationFlashData } from '../../features/constitution/types';

interface ConstitutionPageProps {
    today: string;
    currentSeason: ConstitutionSeasonData;
    summary: {
        violationCount: number;
        spLost: number;
    };
    laws: LawViewData[];
    flash: {
        constitutionViolation: RecordedViolationFlashData | null;
    };
}

export default function ConstitutionIndex(props: ConstitutionPageProps) {
    const [creating, setCreating] = useState(false);
    const [editingLawId, setEditingLawId] = useState<number | null>(null);
    const [recordingLawId, setRecordingLawId] = useState<number | null>(null);
    const [detailsLawId, setDetailsLawId] = useState<number | null>(null);
    const [dismissedViolationId, setDismissedViolationId] = useState<number | null>(null);
    const editingLaw = props.laws.find((law) => law.id === editingLawId) ?? null;
    const recordingLaw = props.laws.find((law) => law.id === recordingLawId) ?? null;
    const detailsLaw = props.laws.find((law) => law.id === detailsLawId) ?? null;
    const recentViolation = props.flash.constitutionViolation?.id === dismissedViolationId ? null : props.flash.constitutionViolation;

    useEffect(() => {
        if (!recentViolation) return;
        const timeout = window.setTimeout(() => setDismissedViolationId(recentViolation.id), 6000);

        return () => window.clearTimeout(timeout);
    }, [recentViolation]);

    function undoViolation() {
        if (!recentViolation) return;

        router.delete(`/constitution/violations/${recentViolation.id}`, {
            preserveScroll: true,
            onSuccess: () => setDismissedViolationId(recentViolation.id),
        });
    }

    return (
        <div style={{ '--module-accent': 'var(--constitution-accent)' } as CSSProperties}>
            <Head title="Constitution" />

            <div className="mx-auto max-w-6xl">
                <header className="mb-6 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold tracking-[-0.05em] sm:text-5xl">Constitution</h1>
                        <p className="mt-1 text-sm font-semibold text-muted">Season {String(props.currentSeason.number).padStart(2, '0')}</p>
                    </div>
                    <Button onClick={() => setCreating(true)}>
                        <Plus aria-hidden="true" size={18} />
                        New Law
                    </Button>
                </header>

                <Surface className="mb-6 grid grid-cols-2 gap-3 p-3 sm:grid-cols-3" elevated>
                    <SummaryMetric icon={<CircleAlert size={18} />} label="Violations" value={props.summary.violationCount.toLocaleString()} />
                    <SummaryMetric danger icon={<TrendingDown size={18} />} label="SP lost" value={props.summary.spLost === 0 ? '0 SP' : `-${props.summary.spLost.toLocaleString()} SP`} />
                    <SummaryMetric className="col-span-2 sm:col-span-1" icon={<Scale size={18} />} label="Season SP" value={`${props.currentSeason.seasonPoints.toLocaleString()} SP`} />
                </Surface>

                <nav aria-label="Constitution views" className="mb-5 flex items-center justify-between border-b border-border-subtle">
                    <div className="flex items-center gap-1">
                        <span aria-current="page" className="icon-text flex min-h-11 items-center gap-2 border-b-2 border-[var(--module-accent)] px-3 text-sm font-bold text-foreground">
                            <ShieldCheck aria-hidden="true" size={17} />
                            Active
                            <span className="rounded-full bg-elevated px-2 py-0.5 text-xs text-secondary">{props.laws.length}</span>
                        </span>
                        <Link className="focus-ring icon-text flex min-h-11 items-center gap-2 rounded-t-xl px-3 text-sm font-bold text-muted hover:bg-surface-hover hover:text-foreground" href="/constitution/archived">
                            <Archive aria-hidden="true" size={17} />
                            Archived
                        </Link>
                    </div>
                </nav>

                {props.laws.length === 0 ? (
                    <Surface className="grid min-h-64 place-items-center p-8 text-center" elevated>
                        <div>
                            <ShieldCheck className="mx-auto text-[var(--module-accent)]" size={34} />
                            <p className="mt-4 text-xl font-bold">No active Laws</p>
                            <Button className="mt-5" onClick={() => setCreating(true)}>
                                <Plus aria-hidden="true" size={18} />
                                Create Law
                            </Button>
                        </div>
                    </Surface>
                ) : (
                    <div className="space-y-2">
                        {props.laws.map((law) => (
                            <LawCard
                                key={law.id}
                                law={law}
                                onDetails={() => setDetailsLawId(law.id)}
                                onRecord={() => setRecordingLawId(law.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {creating && <LawFormDrawer onClose={() => setCreating(false)} />}
            {editingLaw && <LawFormDrawer law={editingLaw} onClose={() => setEditingLawId(null)} />}
            {recordingLaw && <RecordViolationDialog law={recordingLaw} onClose={() => setRecordingLawId(null)} season={props.currentSeason} today={props.today} />}
            {detailsLaw && (
                <LawDetailsDrawer
                    law={detailsLaw}
                    onClose={() => setDetailsLawId(null)}
                    onEdit={() => {
                        setDetailsLawId(null);
                        setEditingLawId(detailsLaw.id);
                    }}
                    onRecord={() => {
                        setDetailsLawId(null);
                        setRecordingLawId(detailsLaw.id);
                    }}
                    season={props.currentSeason}
                    today={props.today}
                />
            )}

            {recentViolation && (
                <div aria-live="polite" className="fixed right-4 bottom-24 left-4 z-40 mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-border-strong bg-elevated p-3 shadow-2xl md:bottom-6">
                    <CircleAlert aria-hidden="true" className="shrink-0 text-danger" size={19} />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                        #{recentViolation.sequence} {recentViolation.lawName} · {recentViolation.penalty.toLocaleString()} SP
                    </span>
                    <button className="focus-ring icon-text flex min-h-10 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-[var(--module-accent)] hover:bg-surface-hover" onClick={undoViolation} type="button">
                        <Undo2 aria-hidden="true" size={15} />
                        Undo
                    </button>
                    <button aria-label="Dismiss" className="focus-ring grid size-10 place-items-center rounded-full text-muted hover:bg-surface-hover hover:text-foreground" onClick={() => setDismissedViolationId(recentViolation.id)} type="button">
                        <X aria-hidden="true" size={17} />
                    </button>
                </div>
            )}
        </div>
    );
}

function SummaryMetric({ className = '', danger = false, icon, label, value }: {
    className?: string;
    danger?: boolean;
    icon: ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className={`flex min-w-0 items-center gap-3 rounded-2xl bg-app px-3 py-3 ${className}`}>
            <span className={`grid size-10 shrink-0 place-items-center rounded-xl bg-elevated ${danger ? 'text-danger' : 'text-[var(--module-accent)]'}`}>{icon}</span>
            <span className="min-w-0">
                <span className="block text-[0.625rem] font-bold tracking-[0.12em] text-muted uppercase">{label}</span>
                <span className={`mt-0.5 block truncate text-lg font-bold ${danger ? 'text-danger' : 'text-foreground'}`}>{value}</span>
            </span>
        </div>
    );
}
