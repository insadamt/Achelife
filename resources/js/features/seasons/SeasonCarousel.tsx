import { useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';

import { RankBadge } from '../../components/rank';
import { StatusChip } from '../../components/ui';
import { classNames } from '../../components/ui/classNames';
import type { SeasonViewData } from './types';

interface SeasonCarouselProps {
    seasons: SeasonViewData[];
    selectedSeasonNumber: number;
    onSelect: (season: SeasonViewData) => void;
}

const stateLabels = {
    completed: 'Completed',
    current: 'Current',
    locked: 'Locked',
} as const;

export function SeasonCarousel({ seasons, selectedSeasonNumber, onSelect }: SeasonCarouselProps) {
    const cardElements = useRef(new Map<number, HTMLLIElement>());
    const realSeasons = seasons.filter((season) => season.state !== 'locked');

    useEffect(() => {
        cardElements.current.get(selectedSeasonNumber)?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center',
        });
    }, [selectedSeasonNumber]);

    function moveSelection(direction: -1 | 1) {
        const selectedIndex = realSeasons.findIndex((season) => season.number === selectedSeasonNumber);
        const nextSeason = realSeasons[selectedIndex + direction];

        if (nextSeason) {
            onSelect(nextSeason);
            requestAnimationFrame(() => cardElements.current.get(nextSeason.number)?.querySelector('button')?.focus());
        }
    }

    function handleKeyboard(event: KeyboardEvent<HTMLButtonElement>) {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            moveSelection(event.key === 'ArrowLeft' ? -1 : 1);
        }

        if (event.key === 'Home' || event.key === 'End') {
            event.preventDefault();
            const targetSeason = event.key === 'Home' ? realSeasons[0] : realSeasons.at(-1);
            if (targetSeason) onSelect(targetSeason);
        }
    }

    return (
        <section aria-label="Season chapter selector" className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-linear-to-r from-app to-transparent sm:w-16" aria-hidden="true" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-linear-to-l from-app to-transparent sm:w-16" aria-hidden="true" />

            <ol className="season-carousel-track flex snap-x snap-mandatory gap-3 overflow-x-auto py-8 [scrollbar-width:none] sm:gap-5 sm:py-10 [&::-webkit-scrollbar]:hidden">
                {seasons.map((season) => {
                    const selected = season.number === selectedSeasonNumber;
                    const locked = season.state === 'locked';

                    return (
                        <li
                            className="w-[15.5rem] shrink-0 snap-center sm:w-[18rem]"
                            key={season.number}
                            ref={(element) => {
                                if (element) cardElements.current.set(season.number, element);
                                else cardElements.current.delete(season.number);
                            }}
                        >
                            <button
                                aria-label={`Season ${season.number}, ${stateLabels[season.state]}${selected ? ', selected' : ''}`}
                                aria-pressed={locked ? undefined : selected}
                                className={classNames(
                                    'focus-ring relative flex min-h-64 w-full flex-col items-center justify-between overflow-hidden rounded-[1.75rem] border px-5 py-6 text-center transition-[transform,border-color,background-color,box-shadow,opacity] duration-200 sm:min-h-72 sm:px-6',
                                    locked && 'cursor-not-allowed border-border-subtle bg-surface text-muted',
                                    !locked && !selected && 'border-border-subtle bg-surface text-secondary hover:-translate-y-1 hover:border-border-strong hover:bg-surface-hover',
                                    selected && 'z-1 scale-[1.04] accent-border accent-glow bg-elevated text-foreground sm:scale-110',
                                    selected && season.state === 'current' && 'season-current-card',
                                )}
                                disabled={locked}
                                onClick={() => onSelect(season)}
                                onKeyDown={handleKeyboard}
                                type="button"
                            >
                                <span>
                                    <span className="block text-[0.625rem] font-bold tracking-[0.24em] text-muted uppercase">Chapter</span>
                                    <span className="mt-2 block text-3xl font-bold tracking-[-0.03em] text-foreground">
                                        Season {String(season.number).padStart(2, '0')}
                                    </span>
                                </span>

                                <StatusChip status={season.state === 'current' ? 'active' : season.state}>{stateLabels[season.state]}</StatusChip>

                                {season.state === 'current' && (
                                    <span>
                                        <span className="block text-3xl font-bold text-foreground">Day {season.day} / 30</span>
                                        {season.rank && <RankBadge className="mt-3 justify-center" compact rank={season.rank} />}
                                        <span className="mt-2 block text-sm font-bold text-foreground">{season.seasonPoints.toLocaleString()} SP</span>
                                        <span className="mt-2 block text-[0.625rem] font-bold tracking-[0.12em] text-muted uppercase">
                                            Objectives {season.objectiveCompletedCount} / {season.objectiveCount}
                                        </span>
                                    </span>
                                )}

                                {season.state === 'completed' && (
                                    <span>
                                        <span className="block text-[0.625rem] font-bold tracking-[0.16em] text-muted uppercase">Final Rank</span>
                                        {season.rank && <RankBadge className="mt-3 justify-center" compact rank={season.rank} />}
                                        <span className="mt-3 block text-xl font-bold text-foreground">{season.seasonPoints.toLocaleString()} SP</span>
                                    </span>
                                )}

                                {locked && <span className="text-xs font-bold tracking-[0.14em] uppercase">Begins after Season {season.number - 1}</span>}
                            </button>
                        </li>
                    );
                })}
            </ol>

            <div className="mt-1 flex items-center justify-center gap-3" aria-label="Carousel controls">
                <button
                    aria-label="Select previous Season"
                    className="focus-ring grid size-11 place-items-center rounded-full border border-border-strong bg-elevated text-xl text-foreground transition-colors hover:border-[var(--module-accent)] disabled:cursor-not-allowed disabled:opacity-35"
                    disabled={selectedSeasonNumber === realSeasons[0]?.number}
                    onClick={() => moveSelection(-1)}
                    type="button"
                >
                    ←
                </button>
                <p className="min-w-32 text-center text-xs font-bold tracking-[0.13em] text-muted uppercase">
                    {selectedSeasonNumber} of {realSeasons.length} unlocked
                </p>
                <button
                    aria-label="Select next Season"
                    className="focus-ring grid size-11 place-items-center rounded-full border border-border-strong bg-elevated text-xl text-foreground transition-colors hover:border-[var(--module-accent)] disabled:cursor-not-allowed disabled:opacity-35"
                    disabled={selectedSeasonNumber === realSeasons.at(-1)?.number}
                    onClick={() => moveSelection(1)}
                    type="button"
                >
                    →
                </button>
            </div>
        </section>
    );
}
