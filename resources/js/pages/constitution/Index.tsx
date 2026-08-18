import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import type { CSSProperties } from 'react';

import { Button, Surface } from '../../components/ui';
import { LawCard } from '../../features/constitution/LawCard';
import { LawDetailsDrawer } from '../../features/constitution/LawDetailsDrawer';
import { LawFormDrawer } from '../../features/constitution/LawFormDrawer';
import { RecordViolationDialog } from '../../features/constitution/RecordViolationDialog';
import type { ConstitutionSeasonData, LawViewData } from '../../features/constitution/types';

interface ConstitutionPageProps {
    today: string;
    currentSeason: ConstitutionSeasonData;
    summary: {
        violationCount: number;
        spLost: number;
    };
    laws: LawViewData[];
    flash: {
        constitutionPenalty: number | null;
    };
}

export default function ConstitutionIndex(props: ConstitutionPageProps) {
    const [creating, setCreating] = useState(false);
    const [editingLawId, setEditingLawId] = useState<number | null>(null);
    const [recordingLawId, setRecordingLawId] = useState<number | null>(null);
    const [detailsLawId, setDetailsLawId] = useState<number | null>(null);
    const editingLaw = props.laws.find((law) => law.id === editingLawId) ?? null;
    const recordingLaw = props.laws.find((law) => law.id === recordingLawId) ?? null;
    const detailsLaw = props.laws.find((law) => law.id === detailsLawId) ?? null;

    return (
        <div style={{ '--module-accent': 'var(--constitution-accent)' } as CSSProperties}>
            <Head title="Constitution" />

            <header className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <div>
                    <p className="text-xs font-bold tracking-[0.2em] text-[var(--module-accent)] uppercase">Personal rule system</p>
                    <h1 className="mt-2 text-4xl font-bold tracking-[-0.05em] sm:text-6xl">Constitution</h1>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-secondary sm:text-base">Laws persist across Seasons. Each repeated current-Season violation carries a stronger consequence.</p>
                </div>
                <div className="rounded-2xl border border-border-subtle bg-surface px-4 py-3 text-right">
                    <p className="text-[0.625rem] font-bold tracking-[0.14em] text-muted uppercase">Season {String(props.currentSeason.number).padStart(2, '0')}</p>
                    <p className="mt-1 text-xl font-bold">{props.currentSeason.seasonPoints.toLocaleString()} SP</p>
                </div>
            </header>

            {props.flash.constitutionPenalty !== null && (
                <div className="mb-5 rounded-2xl border border-danger/45 bg-danger/8 px-5 py-4" role="status">
                    <p className="text-[0.625rem] font-bold tracking-[0.14em] text-muted uppercase">Violation recorded</p>
                    <p className="mt-1 text-3xl font-bold text-danger">{props.flash.constitutionPenalty.toLocaleString()} SP</p>
                </div>
            )}

            <Surface className="mb-7 grid gap-5 p-5 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:p-6" elevated>
                <div>
                    <p className="text-[0.625rem] font-bold tracking-[0.16em] text-muted uppercase">Violations</p>
                    <p className="mt-1 text-4xl font-bold tracking-[-0.04em]">{props.summary.violationCount}</p>
                </div>
                <div className="hidden h-14 w-px bg-border-subtle sm:block" />
                <div className="sm:text-right">
                    <p className="text-[0.625rem] font-bold tracking-[0.16em] text-muted uppercase">SP lost</p>
                    <p className="mt-1 text-4xl font-bold tracking-[-0.04em] text-danger">{props.summary.spLost.toLocaleString()} SP</p>
                </div>
            </Surface>

            <div className="mb-7 flex flex-wrap gap-2">
                <Button onClick={() => setCreating(true)}>+ New Law</Button>
                <Link className="focus-ring inline-flex min-h-11 items-center justify-center rounded-full border border-border-strong bg-elevated px-5 py-2.5 text-sm font-bold tracking-[0.08em] text-foreground uppercase hover:bg-surface-hover" href="/constitution/archived">Archived</Link>
            </div>

            <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-sm font-bold tracking-[0.16em] text-secondary uppercase">Active Laws</h2>
                <span className="text-xs font-semibold text-muted">{props.laws.length} active</span>
            </div>

            {props.laws.length === 0 ? (
                <Surface className="grid min-h-64 place-items-center p-8 text-center" elevated>
                    <div>
                        <p className="text-2xl font-bold">No active Laws</p>
                        <p className="mt-2 max-w-md text-sm leading-6 text-secondary">Create a clear rule. Its severity sets the fixed base penalty for future violations.</p>
                        <Button className="mt-5" onClick={() => setCreating(true)}>Create your first Law</Button>
                    </div>
                </Surface>
            ) : (
                <div className="grid items-start gap-5 xl:grid-cols-2">
                    {props.laws.map((law) => (
                        <LawCard
                            key={law.id}
                            law={law}
                            onDetails={() => setDetailsLawId(law.id)}
                            onEdit={() => setEditingLawId(law.id)}
                            onRecord={() => setRecordingLawId(law.id)}
                        />
                    ))}
                </div>
            )}

            {creating && <LawFormDrawer onClose={() => setCreating(false)} />}
            {editingLaw && <LawFormDrawer law={editingLaw} onClose={() => setEditingLawId(null)} />}
            {recordingLaw && <RecordViolationDialog law={recordingLaw} onClose={() => setRecordingLawId(null)} season={props.currentSeason} today={props.today} />}
            {detailsLaw && <LawDetailsDrawer law={detailsLaw} onClose={() => setDetailsLawId(null)} season={props.currentSeason} today={props.today} />}
        </div>
    );
}
