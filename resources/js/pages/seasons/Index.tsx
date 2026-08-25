import { Head, Link } from '@inertiajs/react';
import { BookOpen, Orbit } from 'lucide-react';
import { useState } from 'react';

import { SeasonCommandCenter } from '../../features/seasons/SeasonCommandCenter';
import { SeasonSwitcher } from '../../features/seasons/SeasonSwitcher';
import type { SeasonViewData } from '../../features/seasons/types';

interface SeasonsPageProps {
    seasons: SeasonViewData[];
    currentSeasonNumber: number;
}

export default function SeasonsIndex({ seasons, currentSeasonNumber }: SeasonsPageProps) {
    const realSeasons = seasons.filter((season) => season.state !== 'locked');
    const [selectedSeasonNumber, setSelectedSeasonNumber] = useState(currentSeasonNumber);
    const selectedSeason = realSeasons.find((season) => season.number === selectedSeasonNumber) ?? realSeasons.at(-1);
    const currentSeason = realSeasons.find((season) => season.number === currentSeasonNumber);

    if (!selectedSeason || !currentSeason) return null;

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
                                {currentSeason.day} / 30 · Season {String(currentSeason.number).padStart(2, '0')}
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

                <div className="mt-5 rounded-[1.5rem] border border-border-subtle bg-surface/55 px-2 sm:px-4">
                    <SeasonSwitcher
                        onSelect={(season) => {
                            if (season.state !== 'locked') setSelectedSeasonNumber(season.number);
                        }}
                        seasons={seasons}
                        selectedSeasonNumber={selectedSeasonNumber}
                    />
                </div>

                <section aria-label="Selected Season" className="mt-5">
                    <SeasonCommandCenter
                        key={selectedSeason.number}
                        onReturnToCurrent={() => setSelectedSeasonNumber(currentSeason.number)}
                        season={selectedSeason}
                    />
                </section>
            </div>
        </div>
    );
}
