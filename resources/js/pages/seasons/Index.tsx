import { Head } from '@inertiajs/react';
import { useState } from 'react';

import { SeasonCarousel } from '../../features/seasons/SeasonCarousel';
import { SeasonDetails } from '../../features/seasons/SeasonDetails';
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

            <header className="mx-auto max-w-3xl text-center">
                <p className="text-xs font-bold tracking-[0.22em] text-[var(--module-accent)] uppercase">Your 30-day path</p>
                <h1 className="mt-3 text-4xl font-bold tracking-[-0.05em] sm:text-6xl">Seasons</h1>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-secondary sm:text-base">
                    Every chapter is exactly 30 calendar days. Your history stays behind you; the next chapter unlocks on its own.
                </p>
                <p className="mt-5 text-xs font-bold tracking-[0.14em] text-muted uppercase">
                    Current · Season {String(currentSeason.number).padStart(2, '0')} · Day {currentSeason.day} of 30
                </p>
            </header>

            <div className="mt-3 sm:mt-5">
                <SeasonCarousel
                    onSelect={(season) => {
                        if (season.state !== 'locked') setSelectedSeasonNumber(season.number);
                    }}
                    seasons={seasons}
                    selectedSeasonNumber={selectedSeasonNumber}
                />
            </div>

            <section aria-label="Selected Season details" className="mx-auto mt-8 max-w-6xl sm:mt-12">
                <SeasonDetails season={selectedSeason} />
            </section>
        </div>
    );
}
