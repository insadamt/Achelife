import { Head, Link, router } from '@inertiajs/react';
import { BookOpen, Coffee, Orbit, PauseCircle, Play } from 'lucide-react';
import { useState } from 'react';

import { Button } from '../../components/ui';
import { SeasonCommandCenter } from '../../features/seasons/SeasonCommandCenter';
import { SeasonSwitcher } from '../../features/seasons/SeasonSwitcher';
import type { SeasonViewData } from '../../features/seasons/types';

interface SeasonsPageProps {
    seasons: SeasonViewData[];
    currentSeasonNumber: number | null;
    cycle: {
        state: 'active' | 'intermission';
        nextSeasonNumber: number;
        holdNextSeason: boolean;
        rolloverPreference: 'automatic' | 'manual';
        intermission: null | {
            reasonLabel: string;
            elapsedRestDays: number;
            proposedStartDate: string;
            proposedEndDate: string;
        };
    };
}

export default function SeasonsIndex({ seasons, currentSeasonNumber, cycle }: SeasonsPageProps) {
    const realSeasons = seasons.filter((season) => season.state === 'completed' || season.state === 'current');
    const initialSeasonNumber = currentSeasonNumber ?? realSeasons.at(-1)?.number ?? 1;
    const [selectedSeasonNumber, setSelectedSeasonNumber] = useState(initialSeasonNumber);
    const selectedSeason = realSeasons.find((season) => season.number === selectedSeasonNumber) ?? realSeasons.at(-1);
    const currentSeason = currentSeasonNumber === null ? null : realSeasons.find((season) => season.number === currentSeasonNumber);

    if (!selectedSeason) return null;

    function startNextSeason() {
        if (!cycle.intermission) return;
        if (window.confirm(`Start Season ${cycle.nextSeasonNumber} on ${cycle.intermission.proposedStartDate} and end it on ${cycle.intermission.proposedEndDate}?`)) {
            router.post('/seasons/start');
        }
    }

    return (
        <div style={{ '--module-accent': 'var(--season-accent)' } as React.CSSProperties}>
            <Head title="Seasons" />

            <div className="mx-auto max-w-6xl">
                <header className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-[color-mix(in_srgb,var(--module-accent)_38%,var(--border-subtle))] bg-[color-mix(in_srgb,var(--module-accent)_8%,transparent)] text-[var(--module-accent)]">
                            <Orbit aria-hidden="true" size={21} />
                        </span>
                        <div>
                            <h1 className="text-3xl font-bold tracking-[-0.045em] sm:text-4xl">Seasons</h1>
                            <p className="mt-0.5 text-xs font-bold tracking-[0.13em] text-muted uppercase">
                                {currentSeason ? `${currentSeason.day} / 30 · Season ${String(currentSeason.number).padStart(2, '0')}` : `Intermission · ${cycle.intermission?.elapsedRestDays ?? 0} rest days`}
                            </p>
                        </div>
                    </div>
                    <Link
                        aria-label="Open Rank guide"
                        className="focus-ring icon-text inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-border-strong bg-elevated px-3 text-xs font-bold tracking-[0.1em] uppercase transition-colors hover:border-[var(--module-accent)] hover:bg-surface-hover sm:px-4"
                        href="/seasons/ranks"
                    >
                        <BookOpen aria-hidden="true" size={16} />
                        <span className="hidden sm:inline">Ranks</span>
                    </Link>
                </header>

                {cycle.state === 'intermission' && cycle.intermission && (
                    <section className="mt-5 flex flex-col gap-4 rounded-[1.5rem] border border-[color-mix(in_srgb,var(--module-accent)_30%,var(--border-subtle))] bg-[color-mix(in_srgb,var(--module-accent)_7%,var(--surface-primary))] p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <Coffee aria-hidden="true" className="mt-0.5 text-[var(--module-accent)]" size={20} />
                            <div>
                                <p className="font-bold">{cycle.intermission.reasonLabel}</p>
                                <p className="mt-1 text-sm text-muted">Season {cycle.nextSeasonNumber} is waiting for you. Its dates will begin today.</p>
                            </div>
                        </div>
                        <Button onClick={startNextSeason} size="small"><Play aria-hidden="true" size={16} />Start Season {cycle.nextSeasonNumber}</Button>
                    </section>
                )}

                {currentSeason && cycle.rolloverPreference === 'automatic' && (
                    <div className="mt-4 flex justify-end">
                        <Button
                            onClick={() => router.put('/seasons/hold', { hold: !cycle.holdNextSeason }, { preserveScroll: true })}
                            size="small"
                            variant="secondary"
                        >
                            <PauseCircle aria-hidden="true" size={16} />
                            {cycle.holdNextSeason ? 'Resume automatic rollover' : 'Pause after this Season'}
                        </Button>
                    </div>
                )}

                <div className="mt-5 rounded-[1.5rem] border border-border-subtle bg-surface/55 px-2 sm:px-4">
                    <SeasonSwitcher
                        onSelect={(season) => {
                            if (season.state === 'completed' || season.state === 'current') setSelectedSeasonNumber(season.number);
                        }}
                        seasons={seasons}
                        selectedSeasonNumber={selectedSeasonNumber}
                    />
                </div>

                <section aria-label="Selected Season" className="mt-5">
                    <SeasonCommandCenter
                        key={selectedSeason.number}
                        onReturnToCurrent={() => setSelectedSeasonNumber(currentSeason?.number ?? selectedSeason.number)}
                        season={selectedSeason}
                    />
                </section>
            </div>
        </div>
    );
}
