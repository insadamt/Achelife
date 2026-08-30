import { AlertTriangle, CalendarClock, DatabaseZap } from 'lucide-react';

import { Surface } from '../../components/ui';
import type { RestorePreview } from './types';

function ageLabel(seconds: number): string {
    if (seconds < 60) return 'Created moments ago';
    if (seconds < 3600) return `Created ${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `Created ${Math.floor(seconds / 3600)} hours ago`;

    return `Created ${Math.floor(seconds / 86400)} days ago`;
}

function rankLabel(rank: string): string {
    return rank.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function RestorePreviewCard({ preview }: { preview: RestorePreview }) {
    const catchUp = preview.catchUp;

    return (
        <div className="mt-5 space-y-4" aria-label="Validated restore preview">
            <Surface className="border-accent/35 p-5">
                <div className="flex items-start gap-3">
                    <DatabaseZap className="mt-0.5 shrink-0 text-accent" size={20} />
                    <div>
                        <p className="font-bold">Validated Achelife archive</p>
                        <p className="mt-1 text-sm leading-6 text-secondary">
                            {ageLabel(preview.ageSeconds)} · App {preview.sourceApplicationVersion} · Archive format {preview.archiveFormatVersion}
                        </p>
                        <p className="text-sm leading-6 text-secondary">Timezone {preview.timezone} · Calendar began {preview.calendarStartedOn}</p>
                    </div>
                </div>
            </Surface>

            {preview.latestSeason && (
                <div className="grid gap-3 sm:grid-cols-3">
                    <Surface className="p-4"><p className="text-xs font-bold tracking-wider text-muted uppercase">Latest Season</p><p className="mt-2 text-lg font-bold">Season {preview.latestSeason.number}</p><p className="text-sm text-secondary">{preview.latestSeason.startDate} – {preview.latestSeason.endDate}</p></Surface>
                    <Surface className="p-4"><p className="text-xs font-bold tracking-wider text-muted uppercase">Rank & SP</p><p className="mt-2 text-lg font-bold">{rankLabel(preview.latestSeason.rank)}</p><p className="text-sm text-secondary">{preview.latestSeason.seasonPoints.toLocaleString()} SP</p></Surface>
                    <Surface className="p-4"><p className="text-xs font-bold tracking-wider text-muted uppercase">Restore hold</p><p className="mt-2 text-lg font-bold">Season {catchUp?.heldSeasonNumber}</p><p className="text-sm text-secondary">Waits for you after the imported Day 30.</p></Surface>
                </div>
            )}

            {catchUp && (
                <Surface className="p-5">
                    <div className="flex items-start gap-3"><CalendarClock className="mt-0.5 text-accent" size={20} /><div><p className="font-bold">Bounded catch-up preview</p><p className="mt-1 text-sm text-secondary">{catchUp.throughDate ? `${catchUp.fromDate} through ${catchUp.throughDate}` : 'No elapsed Season dates to catch up'} · never beyond original Day 30 ({catchUp.originalDay30})</p></div></div>
                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                        <div><dt className="text-muted">Habit misses</dt><dd className="font-bold">{catchUp.habitMisses}</dd></div>
                        <div><dt className="text-muted">Diary missed days / streak</dt><dd className="font-bold">{catchUp.diary.missedDays} / {catchUp.diary.resultingStreak}</dd></div>
                        <div><dt className="text-muted">Recurring Tasks</dt><dd className="font-bold">{catchUp.recurringTaskOccurrences}</dd></div>
                        <div><dt className="text-muted">Automatic Subscriptions</dt><dd className="font-bold">{catchUp.subscriptions.automaticCount}{Object.entries(catchUp.subscriptions.automaticValueMinorByCurrency).map(([currency, value]) => ` · ${currency} ${(value / 100).toFixed(2)}`)}</dd></div>
                    </dl>
                </Surface>
            )}

            <div className="rounded-2xl border border-warning/35 bg-warning/10 p-4 text-sm leading-6 text-warning">
                <p className="flex items-center gap-2 font-bold"><AlertTriangle size={17} /> Snapshot warning</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">{preview.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
            </div>

            <div className="flex flex-wrap gap-2">
                {Object.entries(preview.countsByModule).map(([module, count]) => <span className="rounded-full border border-border-subtle bg-app px-3 py-1 text-xs font-semibold text-secondary" key={module}>{module}: {count}</span>)}
            </div>
        </div>
    );
}
