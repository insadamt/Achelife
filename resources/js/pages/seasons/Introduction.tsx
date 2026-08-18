import { Head, router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';

import { Button, StatusChip } from '../../components/ui';
import { formatSeasonRange } from '../../features/seasons/dateFormat';
import type { SeasonViewData } from '../../features/seasons/types';

interface SeasonIntroductionProps {
    season: SeasonViewData;
    previousSeason: SeasonViewData | null;
}

export default function SeasonIntroduction({ season, previousSeason }: SeasonIntroductionProps) {
    const continuingRef = useRef(false);
    const isFirstSeason = previousSeason === null;

    function continueToAchelife() {
        if (continuingRef.current || season.id === null) return;
        continuingRef.current = true;
        router.post(`/seasons/${season.id}/introduction`);
    }

    useEffect(() => {
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const timer = window.setTimeout(continueToAchelife, reducedMotion ? 1200 : 3600);

        return () => window.clearTimeout(timer);
    });

    return (
        <div className="season-introduction relative grid min-h-screen place-items-center px-5 py-10 text-center">
            <Head title={`Season ${season.number}`} />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,color-mix(in_srgb,var(--module-accent)_13%,transparent),transparent_38%)]" aria-hidden="true" />

            <section className="relative w-full max-w-2xl" aria-labelledby="season-introduction-title">
                {previousSeason && (
                    <div className="season-introduction-previous mb-9">
                        <p className="text-sm font-bold tracking-[0.19em] text-muted uppercase">
                            Season {String(previousSeason.number).padStart(2, '0')}
                        </p>
                        <div className="mt-3">
                            <StatusChip status="completed">Completed</StatusChip>
                        </div>
                        <div className="mx-auto mt-7 h-10 w-px bg-linear-to-b from-border-strong to-[var(--module-accent)]" aria-hidden="true" />
                        <span className="mt-1 block text-xl text-[var(--module-accent)]" aria-hidden="true">↓</span>
                    </div>
                )}

                <div className="season-introduction-current">
                    <p className="text-xs font-bold tracking-[0.25em] text-[var(--module-accent)] uppercase">
                        {isFirstSeason ? 'Your first chapter' : 'A new chapter'}
                    </p>
                    <h1 id="season-introduction-title" className="mt-4 text-5xl font-bold tracking-[-0.055em] sm:text-7xl">
                        Season {String(season.number).padStart(2, '0')}
                    </h1>
                    <p className="mt-5 text-2xl font-bold text-foreground">Day {season.day} / 30</p>
                    <p className="mt-2 text-sm font-semibold text-secondary">{formatSeasonRange(season.startDate, season.endDate)}</p>
                    <p className="mt-9 text-lg text-secondary sm:text-xl">
                        {isFirstSeason ? 'Your journey begins.' : 'Your next 30 days begin here.'}
                    </p>
                    <Button className="mt-9 min-w-44" onClick={continueToAchelife}>
                        Enter Season
                    </Button>
                    <p className="mt-4 text-xs text-muted">Continuing automatically…</p>
                </div>
            </section>
        </div>
    );
}
