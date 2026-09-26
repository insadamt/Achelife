import { Settings } from 'lucide-react';

import { CircularProgress } from '../../components/ui/CircularProgress';
import type { TodayProgressData } from './types';

interface TodayOverviewProps {
    date: string;
    seasonNumber: number;
    seasonDay: number;
    progress: TodayProgressData;
    onOpenSettings: () => void;
}

function calendarDateLabel(date: string) {
    return new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(new Date(`${date}T00:00:00Z`));
}

export function TodayOverview({ date, seasonNumber, seasonDay, progress, onOpenSettings }: TodayOverviewProps) {
    return (
        <div className="mb-5 space-y-3">
            <header className="today-glass flex items-center justify-between gap-4 rounded-[1.5rem] px-4 py-3.5 sm:px-5">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                        <h1 className="text-2xl font-bold leading-none tracking-[-0.04em]">Today</h1>
                        <p className="text-sm font-medium text-secondary">{calendarDateLabel(date)}</p>
                    </div>
                    <p className="mt-1.5 text-xs font-semibold text-muted">Season {String(seasonNumber).padStart(2, '0')} · Day {seasonDay} / 30</p>
                </div>
                <button
                    aria-label="Open Today settings"
                    className="today-glass-inner focus-ring grid size-10 shrink-0 place-items-center rounded-xl text-secondary transition-colors hover:text-foreground"
                    onClick={onOpenSettings}
                    type="button"
                >
                    <Settings aria-hidden="true" size={18} />
                </button>
            </header>

            <section aria-labelledby="today-daily-progress-title" className="today-glass flex items-center justify-between gap-3 rounded-[1.5rem] px-4 py-4 sm:gap-6 sm:px-5">
                <div className="min-w-0 flex-1">
                    <h2 className="text-xs font-bold tracking-[0.13em] text-secondary uppercase" id="today-daily-progress-title">Daily progress</h2>
                    <p aria-live="polite" className="mt-1.5 text-xl font-bold tracking-[-0.035em] sm:text-2xl">
                        <span className="today-count-change inline-block" key={progress.completed}>{progress.completed}</span> <span className="text-secondary">of {progress.total} complete</span>
                    </p>
                    <p className="mt-1.5 text-xs text-muted">Tasks {progress.breakdown.tasks.completed}/{progress.breakdown.tasks.total} · Habits {progress.breakdown.habits.completed}/{progress.breakdown.habits.total} · Includes Diary</p>
                </div>
                <div className="shrink-0">
                    <CircularProgress
                        centerContent={<span className="text-lg font-bold tracking-[-0.05em]">{progress.percentage}%</span>}
                        label="Daily progress"
                        maximum={progress.total}
                        size={82}
                        value={progress.completed}
                    />
                </div>
            </section>
        </div>
    );
}
