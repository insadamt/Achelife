import { useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { Check, ChevronLeft, ChevronRight, Crown, LockKeyhole } from 'lucide-react';

import { classNames } from '../../components/ui/classNames';
import { formatSeasonRange, formatShortDate } from './dateFormat';
import type { SeasonViewData } from './types';

interface SeasonSwitcherProps {
    seasons: SeasonViewData[];
    selectedSeasonNumber: number;
    onSelect: (season: SeasonViewData) => void;
}

function SeasonStateIcon({ season }: { season: SeasonViewData }) {
    if (season.state === 'current') return <Crown aria-hidden="true" size={21} strokeWidth={2.2} />;
    if (season.state === 'completed') return <Check aria-hidden="true" size={21} strokeWidth={2.5} />;

    return <LockKeyhole aria-hidden="true" size={18} />;
}

function seasonAccessibleLabel(season: SeasonViewData, selected: boolean) {
    const state = season.state === 'current' ? `current, day ${season.day} of 30` : season.state;
    const date = season.state === 'held'
        ? 'waiting for you'
        : season.state === 'locked'
          ? season.startDate ? `starts ${formatShortDate(season.startDate)}` : 'date not scheduled'
          : formatSeasonRange(season.startDate, season.endDate);

    return `Season ${season.number}, ${state}, ${date}${selected ? ', selected' : ''}`;
}

export function SeasonSwitcher({ seasons, selectedSeasonNumber, onSelect }: SeasonSwitcherProps) {
    const seasonElements = useRef(new Map<number, HTMLLIElement>());
    const selectableSeasons = seasons.filter((season) => season.state !== 'locked' && season.state !== 'held');
    const selectedIndex = selectableSeasons.findIndex((season) => season.number === selectedSeasonNumber);

    useEffect(() => {
        seasonElements.current.get(selectedSeasonNumber)?.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
            block: 'nearest',
            inline: 'center',
        });
    }, [selectedSeasonNumber]);

    function selectByOffset(offset: -1 | 1) {
        const nextSeason = selectableSeasons[selectedIndex + offset];

        if (!nextSeason) return;

        onSelect(nextSeason);
        requestAnimationFrame(() => seasonElements.current.get(nextSeason.number)?.querySelector('button')?.focus());
    }

    function handleKeyboard(event: KeyboardEvent<HTMLButtonElement>) {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            selectByOffset(event.key === 'ArrowLeft' ? -1 : 1);
        }

        if (event.key === 'Home' || event.key === 'End') {
            event.preventDefault();
            const targetSeason = event.key === 'Home' ? selectableSeasons[0] : selectableSeasons.at(-1);
            if (targetSeason) onSelect(targetSeason);
        }
    }

    return (
        <section aria-label="Season switcher" className="flex items-center gap-2 sm:gap-3">
            <button
                aria-label="Previous Season"
                className="focus-ring grid size-10 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-25"
                disabled={selectedIndex <= 0}
                onClick={() => selectByOffset(-1)}
                type="button"
            >
                <ChevronLeft aria-hidden="true" size={19} />
            </button>

            <ol className="season-switcher-track flex min-w-0 flex-1 snap-x snap-mandatory gap-2 overflow-x-auto py-3 [scrollbar-width:none] sm:gap-3 [&::-webkit-scrollbar]:hidden">
                {seasons.map((season) => {
                    const selected = season.number === selectedSeasonNumber;
                    const locked = season.state === 'locked' || season.state === 'held';

                    return (
                        <li
                            className="w-20 shrink-0 snap-center"
                            key={season.number}
                            ref={(element) => {
                                if (element) seasonElements.current.set(season.number, element);
                                else seasonElements.current.delete(season.number);
                            }}
                        >
                            <button
                                aria-label={seasonAccessibleLabel(season, selected)}
                                aria-pressed={locked ? undefined : selected}
                                className={classNames(
                                    'focus-ring group flex w-full flex-col items-center rounded-2xl px-1 py-2 transition-[transform,background-color,color,opacity] duration-200',
                                    selected && 'bg-[color-mix(in_srgb,var(--module-accent)_8%,transparent)] text-foreground',
                                    !selected && !locked && 'text-secondary hover:-translate-y-0.5 hover:bg-surface-hover',
                                    locked && 'cursor-not-allowed text-muted opacity-45',
                                )}
                                disabled={locked}
                                onClick={() => onSelect(season)}
                                onKeyDown={handleKeyboard}
                                title={season.state === 'held' ? 'Waiting for you' : locked ? (season.startDate ? `Starts ${formatShortDate(season.startDate)}` : 'Date not scheduled') : formatSeasonRange(season.startDate, season.endDate)}
                                type="button"
                            >
                                <span
                                    className={classNames(
                                        'relative grid size-12 place-items-center transition-transform duration-200 group-hover:scale-105',
                                        selected && 'scale-110',
                                    )}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={classNames(
                                            'absolute inset-1 rotate-45 rounded-[0.9rem] border bg-surface shadow-[0_8px_20px_rgba(0,0,0,0.24)]',
                                            season.state === 'current' && 'border-[var(--module-accent)] bg-[color-mix(in_srgb,var(--module-accent)_12%,var(--surface-primary))] shadow-[0_0_22px_color-mix(in_srgb,var(--module-accent)_18%,transparent)]',
                                            season.state === 'completed' && 'border-success/45 bg-success/8',
                                            locked && 'border-border-subtle bg-surface/50',
                                        )}
                                    />
                                    <span className={classNames('relative', season.state === 'current' && 'text-[var(--module-accent)]', season.state === 'completed' && 'text-success')}>
                                        <SeasonStateIcon season={season} />
                                    </span>
                                </span>
                                <span className="mt-2 text-xs font-bold tracking-[0.1em]">S{String(season.number).padStart(2, '0')}</span>
                                <span className={classNames('mt-1 h-0.5 w-5 rounded-full', selected ? 'bg-[var(--module-accent)]' : 'bg-transparent')} aria-hidden="true" />
                            </button>
                        </li>
                    );
                })}
            </ol>

            <button
                aria-label="Next Season"
                className="focus-ring grid size-10 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-25"
                disabled={selectedIndex === selectableSeasons.length - 1}
                onClick={() => selectByOffset(1)}
                type="button"
            >
                <ChevronRight aria-hidden="true" size={19} />
            </button>
        </section>
    );
}
