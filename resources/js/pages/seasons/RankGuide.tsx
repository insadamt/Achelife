import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, ChevronLeft, ChevronRight, Info, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, UIEvent } from 'react';

import { RankEmblem } from '../../components/rank';
import { rankAccents } from '../../components/rank/rankPresentation';
import { StatusChip, Surface } from '../../components/ui';
import { classNames } from '../../components/ui/classNames';
import type { RankViewData } from '../../features/seasons/types';
import type { SharedPageProps } from '../../types';

interface RankGuideProps {
    ranks: RankViewData[];
}

function formatThreshold(rank: RankViewData) {
    if (rank.minimumSp === null) return 'Below 0 SP';

    return rank.topRank ? `${rank.minimumSp.toLocaleString()}+ SP` : `${rank.minimumSp.toLocaleString()} SP`;
}

function rankCardTransform(index: number, selectedIndex: number) {
    const distance = index - selectedIndex;
    const absoluteDistance = Math.abs(distance);

    if (distance === 0) return 'perspective(900px) translateZ(42px) scale(1) rotateY(0deg)';

    const rotation = distance < 0 ? 14 : -14;
    const scale = absoluteDistance === 1 ? 0.86 : 0.76;
    const depth = absoluteDistance === 1 ? -30 : -70;

    return `perspective(900px) translateZ(${depth}px) scale(${scale}) rotateY(${rotation}deg)`;
}

export default function RankGuide({ ranks }: RankGuideProps) {
    const progressSeason = usePage<SharedPageProps>().props.progressPanel?.season;
    const currentRankKey = progressSeason?.rank?.key;
    const currentRankIndex = Math.max(0, ranks.findIndex((rank) => rank.key === currentRankKey));
    const [selectedIndex, setSelectedIndex] = useState(currentRankIndex);
    const trackElement = useRef<HTMLOListElement>(null);
    const rankElements = useRef(new Map<number, HTMLLIElement>());
    const scrollFrame = useRef<number | null>(null);
    const selectedRank = ranks[selectedIndex] ?? ranks[0];
    const nextRank = ranks[selectedIndex + 1];
    const selectedIsCurrent = selectedRank?.key === currentRankKey;

    useEffect(() => {
        rankElements.current.get(currentRankIndex)?.scrollIntoView({ block: 'nearest', inline: 'center' });

        return () => {
            if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current);
        };
    }, [currentRankIndex]);

    function selectRank(index: number, focus = false) {
        const safeIndex = Math.min(ranks.length - 1, Math.max(0, index));
        const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

        setSelectedIndex(safeIndex);
        rankElements.current.get(safeIndex)?.scrollIntoView({ behavior, block: 'nearest', inline: 'center' });

        if (focus) requestAnimationFrame(() => rankElements.current.get(safeIndex)?.querySelector('button')?.focus());
    }

    function updateSelectionFromScroll(event: UIEvent<HTMLOListElement>) {
        if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current);

        const track = event.currentTarget;
        scrollFrame.current = requestAnimationFrame(() => {
            const trackBounds = track.getBoundingClientRect();
            const trackCenter = trackBounds.left + trackBounds.width / 2;
            let closestIndex = selectedIndex;
            let closestDistance = Number.POSITIVE_INFINITY;

            rankElements.current.forEach((element, index) => {
                const bounds = element.getBoundingClientRect();
                const distance = Math.abs(bounds.left + bounds.width / 2 - trackCenter);

                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestIndex = index;
                }
            });

            setSelectedIndex(closestIndex);
        });
    }

    function handleKeyboard(event: KeyboardEvent<HTMLButtonElement>, index: number) {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            selectRank(index + (event.key === 'ArrowLeft' ? -1 : 1), true);
        }

        if (event.key === 'Home' || event.key === 'End') {
            event.preventDefault();
            selectRank(event.key === 'Home' ? 0 : ranks.length - 1, true);
        }
    }

    if (!selectedRank) return null;

    return (
        <div style={{ '--module-accent': 'var(--season-accent)' } as CSSProperties}>
            <Head title="Season Rank Guide" />

            <div className="mx-auto max-w-6xl">
                <header className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                        <Link
                            aria-label="Back to Seasons"
                            className="focus-ring grid size-11 shrink-0 place-items-center rounded-full border border-border-subtle bg-surface text-secondary transition-colors hover:border-border-strong hover:text-foreground"
                            href="/seasons"
                            title="Back to Seasons"
                        >
                            <ArrowLeft aria-hidden="true" size={19} />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-[-0.045em] sm:text-4xl">Rank Explorer</h1>
                            <p className="mt-0.5 text-xs font-bold tracking-[0.13em] text-muted uppercase">22 divisions · 100 SP each</p>
                        </div>
                    </div>
                    {currentRankIndex !== selectedIndex && (
                        <button
                            className="focus-ring rounded-full px-3 py-2 text-xs font-bold tracking-[0.1em] text-[var(--module-accent)] uppercase hover:bg-surface-hover"
                            onClick={() => selectRank(currentRankIndex)}
                            type="button"
                        >
                            My Rank
                        </button>
                    )}
                </header>

                <Surface className="rank-explorer-shell mt-6 overflow-hidden py-6 sm:py-8" elevated>
                    <div className="flex items-center justify-between gap-4 px-5 sm:px-8">
                        <div>
                            <p className="text-[0.625rem] font-bold tracking-[0.17em] text-muted uppercase">Selected division</p>
                            <p className="mt-1 text-sm font-bold text-secondary">{selectedIndex + 1} of {ranks.length}</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                aria-label="Previous Rank"
                                className="focus-ring grid size-10 place-items-center rounded-full border border-border-strong bg-app text-secondary transition-colors hover:border-[var(--module-accent)] hover:text-foreground disabled:opacity-25"
                                disabled={selectedIndex === 0}
                                onClick={() => selectRank(selectedIndex - 1)}
                                type="button"
                            >
                                <ChevronLeft aria-hidden="true" size={18} />
                            </button>
                            <button
                                aria-label="Next Rank"
                                className="focus-ring grid size-10 place-items-center rounded-full border border-border-strong bg-app text-secondary transition-colors hover:border-[var(--module-accent)] hover:text-foreground disabled:opacity-25"
                                disabled={selectedIndex === ranks.length - 1}
                                onClick={() => selectRank(selectedIndex + 1)}
                                type="button"
                            >
                                <ChevronRight aria-hidden="true" size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="relative mt-3">
                        <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-8 bg-linear-to-r from-elevated to-transparent sm:w-24" aria-hidden="true" />
                        <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-8 bg-linear-to-l from-elevated to-transparent sm:w-24" aria-hidden="true" />

                        <ol
                            aria-label="Rank divisions"
                            className="rank-carousel-track flex snap-x snap-mandatory gap-2 overflow-x-auto py-8 [scrollbar-width:none] sm:gap-4 sm:py-10 [&::-webkit-scrollbar]:hidden"
                            onScroll={updateSelectionFromScroll}
                            ref={trackElement}
                        >
                            {ranks.map((rank, index) => {
                                const selected = index === selectedIndex;
                                const current = rank.key === currentRankKey;
                                const distance = Math.abs(index - selectedIndex);
                                const cardStyle = {
                                    opacity: selected ? 1 : distance === 1 ? 0.62 : 0.28,
                                    transform: rankCardTransform(index, selectedIndex),
                                    transformOrigin: index < selectedIndex ? 'right center' : index > selectedIndex ? 'left center' : 'center',
                                    zIndex: selected ? 10 : Math.max(1, 8 - distance),
                                } as CSSProperties;
                                const rankStyle = { '--rank-accent': rankAccents[rank.tier] } as CSSProperties;

                                return (
                                    <li
                                        className="w-[min(68vw,20rem)] shrink-0 snap-center"
                                        key={rank.key}
                                        ref={(element) => {
                                            if (element) rankElements.current.set(index, element);
                                            else rankElements.current.delete(index);
                                        }}
                                        style={rankStyle}
                                    >
                                        <button
                                            aria-label={`${rank.displayName}, unlocks at ${formatThreshold(rank)}${current ? ', your current Rank' : ''}${selected ? ', selected' : ''}`}
                                            aria-pressed={selected}
                                            className={classNames(
                                                'focus-ring relative flex min-h-80 w-full flex-col items-center overflow-hidden rounded-[2rem] border bg-app px-5 py-6 text-center transition-[transform,opacity,border-color,background-color,box-shadow] duration-200',
                                                selected
                                                    ? 'border-[color-mix(in_srgb,var(--rank-accent)_60%,var(--border-strong))] bg-[color-mix(in_srgb,var(--rank-accent)_7%,var(--surface-primary))] shadow-[0_24px_60px_color-mix(in_srgb,var(--rank-accent)_16%,transparent)]'
                                                    : 'border-border-subtle',
                                            )}
                                            onClick={() => selectRank(index)}
                                            onKeyDown={(event) => handleKeyboard(event, index)}
                                            style={cardStyle}
                                            type="button"
                                        >
                                            <span className="absolute inset-x-8 top-0 h-28 rounded-full bg-[var(--rank-accent)] opacity-8 blur-3xl" aria-hidden="true" />
                                            <span className="relative flex h-7 items-center">
                                                {current && <StatusChip status="active">Your Rank</StatusChip>}
                                            </span>
                                            <RankEmblem className="relative mt-3 size-32 drop-shadow-[0_0_22px_color-mix(in_srgb,var(--rank-accent)_28%,transparent)] sm:size-36" rank={rank} />
                                            <span className="mt-4 text-3xl font-bold tracking-[-0.05em] text-[var(--rank-accent)] uppercase sm:text-4xl">
                                                {rank.displayName}
                                            </span>
                                            <span className="mt-auto pt-5 text-[0.625rem] font-bold tracking-[0.15em] text-muted uppercase">Unlocks at</span>
                                            <span className="mt-1 text-lg font-bold tabular-nums text-foreground">{formatThreshold(rank)}</span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ol>
                    </div>

                    <div className="mx-5 grid gap-px overflow-hidden rounded-2xl border border-border-subtle bg-border-subtle sm:mx-8 sm:grid-cols-3">
                        <div className="bg-app px-4 py-3 sm:px-5 sm:py-4">
                            <p className="text-[0.625rem] font-bold tracking-[0.14em] text-muted uppercase">Minimum</p>
                            <p className="mt-1 text-lg font-bold">{formatThreshold(selectedRank)}</p>
                        </div>
                        <div className="bg-app px-4 py-3 sm:px-5 sm:py-4">
                            <p className="text-[0.625rem] font-bold tracking-[0.14em] text-muted uppercase">Next</p>
                            <p className="mt-1 text-lg font-bold">{nextRank?.displayName ?? 'No ceiling'}</p>
                        </div>
                        <div className="bg-app px-4 py-3 sm:px-5 sm:py-4">
                            <p className="text-[0.625rem] font-bold tracking-[0.14em] text-muted uppercase">Status</p>
                            <p className={classNames('mt-1 text-lg font-bold', selectedIsCurrent ? 'text-[var(--module-accent)]' : 'text-secondary')}>
                                {selectedIsCurrent ? `${progressSeason?.seasonPoints.toLocaleString() ?? 0} SP now` : selectedIndex < currentRankIndex ? 'Passed' : 'Ahead'}
                            </p>
                        </div>
                    </div>

                    <div className="mx-auto mt-5 flex max-w-xl items-center justify-center gap-1 px-5" aria-hidden="true">
                        {ranks.map((rank, index) => (
                            <span
                                className={classNames(
                                    'h-1.5 rounded-full transition-[width,background-color] duration-200',
                                    index === selectedIndex ? 'w-5 bg-[var(--module-accent)]' : rank.key === currentRankKey ? 'w-2 bg-success' : 'w-1.5 bg-border-strong',
                                )}
                                key={rank.key}
                            />
                        ))}
                    </div>
                </Surface>

                <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs leading-5 text-muted">
                    <Info aria-hidden="true" size={14} />
                    Negative SP is Unranked. <Sparkles aria-hidden="true" size={13} /> Legend continues beyond 2,100 SP.
                </p>
            </div>
        </div>
    );
}
