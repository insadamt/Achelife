import { Head } from '@inertiajs/react';
import { ArchiveRestore, CalendarCheck, Download, Trophy } from 'lucide-react';

import { Button, Surface } from '../../components/ui';

interface RestoreSummary {
    restoredAt: string;
    timezone: string;
    seasonNumber: number;
    seasonEndDate: string;
    seasonFinalized: boolean;
    seasonCloseoutUrl: string | null;
    activeSeasonContinues: boolean;
    restoreIntermissionStartsOn: string;
    heldSeasonNumber: number;
    safetyArchiveName?: string;
    safetyArchiveUrl?: string;
    catchUp: null | {
        habitMisses: number;
        recurringTaskOccurrences: number;
        diary: { missedDays: number; resultingStreak: number };
        subscriptions: { automaticCount: number; automaticValueMinor: number; automaticValueMinorByCurrency: Record<string, number> };
    };
}

export default function Welcome({ summary }: { summary: RestoreSummary }) {
    return (
        <div className="mx-auto max-w-4xl">
            <Head title="Welcome back" />
            <header><p className="text-xs font-bold tracking-[0.18em] text-accent uppercase">Restore complete</p><h1 className="mt-2 text-4xl font-bold tracking-[-0.04em] sm:text-6xl">Welcome back.</h1><p className="mt-3 max-w-2xl text-base leading-7 text-secondary">Your snapshot was restored with its original calendar and timezone. No empty Seasons were created for time away.</p></header>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <Surface className="p-5"><ArchiveRestore className="text-accent" size={20} /><p className="mt-4 text-sm text-muted">Imported timeline</p><p className="text-xl font-bold">Season {summary.seasonNumber}</p><p className="text-sm text-secondary">Day 30: {summary.seasonEndDate}</p></Surface>
                <Surface className="p-5"><CalendarCheck className="text-accent" size={20} /><p className="mt-4 text-sm text-muted">Current state</p><p className="text-xl font-bold">{summary.activeSeasonContinues ? 'Season continues' : 'Restore intermission'}</p><p className="text-sm text-secondary">Season {summary.heldSeasonNumber} waits for you.</p></Surface>
                <Surface className="p-5"><Trophy className="text-accent" size={20} /><p className="mt-4 text-sm text-muted">Catch-up</p><p className="text-xl font-bold">Through original Day 30</p><p className="text-sm text-secondary">Timezone: {summary.timezone}</p></Surface>
            </div>

            {summary.catchUp && <Surface className="mt-5 p-5"><h2 className="font-bold">Catch-up summary</h2><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-4"><div><dt className="text-muted">Habit misses</dt><dd className="font-bold">{summary.catchUp.habitMisses}</dd></div><div><dt className="text-muted">Diary missed days</dt><dd className="font-bold">{summary.catchUp.diary.missedDays}</dd></div><div><dt className="text-muted">Recurring Tasks</dt><dd className="font-bold">{summary.catchUp.recurringTaskOccurrences}</dd></div><div><dt className="text-muted">Subscriptions</dt><dd className="font-bold">{summary.catchUp.subscriptions.automaticCount}</dd></div></dl></Surface>}

            {summary.safetyArchiveUrl && <div className="mt-5 rounded-2xl border border-warning/35 bg-warning/10 p-4 text-sm leading-6 text-warning"><p className="font-bold">Your verified pre-restore safety export is retained.</p><a className="focus-ring icon-text mt-3 inline-flex items-center gap-2 rounded-xl border border-warning/40 px-3 py-2 font-bold" href={summary.safetyArchiveUrl}><Download size={16} /> Download safety export</a></div>}

            <div className="mt-7 flex flex-wrap gap-3">
                {summary.seasonCloseoutUrl && <Button onClick={() => { window.location.href = summary.seasonCloseoutUrl as string; }}>Review imported Season closeout</Button>}
                {!summary.seasonCloseoutUrl && <Button onClick={() => { window.location.href = '/home'; }}>Continue to Achelife</Button>}
                {summary.seasonCloseoutUrl && <Button onClick={() => { window.location.href = '/home'; }} variant="secondary">Go to Today</Button>}
            </div>
        </div>
    );
}
