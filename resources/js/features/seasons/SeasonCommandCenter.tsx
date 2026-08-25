import { Link } from '@inertiajs/react';
import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { ArrowUpRight, CalendarDays, CheckCircle2, Clock3, RotateCcw, Target } from 'lucide-react';

import { RankEmblem, RankProgress } from '../../components/rank';
import { rankAccents } from '../../components/rank/rankPresentation';
import { Button, StatusChip, Surface } from '../../components/ui';
import { ObjectiveBoard } from './ObjectiveBoard';
import { SeasonDayTrack } from './SeasonDayTrack';
import { formatSeasonRange } from './dateFormat';
import type { SeasonViewData } from './types';

function PulseMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-border-subtle bg-app/65 p-4">
            <div className="flex items-center gap-2 text-muted">
                {icon}
                <p className="text-[0.625rem] font-bold tracking-[0.14em] uppercase">{label}</p>
            </div>
            <p className="mt-2 text-xl font-bold tracking-[-0.025em] text-foreground">{value}</p>
        </div>
    );
}

export function SeasonCommandCenter({ season, onReturnToCurrent }: { season: SeasonViewData; onReturnToCurrent: () => void }) {
    const [creatingObjective, setCreatingObjective] = useState(false);
    const completedSeason = season.state === 'completed';
    const daysReached = completedSeason ? 30 : (season.day ?? 0);
    const daysRemaining = Math.max(0, 30 - daysReached);
    const rankAccent = season.rank ? rankAccents[season.rank.tier] : 'var(--module-accent)';
    const heroStyle = { '--rank-accent': rankAccent } as CSSProperties;
    const setupValue = completedSeason
        ? 'Archived'
        : season.objectiveSetupOpen
          ? season.objectiveSetupDaysRemaining === 0
              ? 'Final day'
              : `${season.objectiveSetupDaysRemaining}d to lock`
          : 'Locked';

    return (
        <div>
            <Surface className="season-command-hero relative overflow-hidden p-5 sm:p-7 lg:p-9" elevated style={heroStyle}>
                <div className="relative z-1 flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <p className="text-xs font-bold tracking-[0.18em] text-[var(--module-accent)] uppercase">
                                Season {String(season.number).padStart(2, '0')}
                            </p>
                            <StatusChip status={completedSeason ? 'completed' : 'active'}>{completedSeason ? 'Completed' : 'Current'}</StatusChip>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-secondary">{formatSeasonRange(season.startDate, season.endDate)}</p>
                    </div>
                    {completedSeason && (
                        <Button aria-label="Return to current Season" onClick={onReturnToCurrent} size="small" variant="ghost">
                            <RotateCcw aria-hidden="true" size={16} />
                            Current
                        </Button>
                    )}
                </div>

                <div className="relative z-1 mt-7 grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)] lg:gap-7">
                    <Link
                        aria-label={`Explore the Rank guide from ${season.rank?.displayName ?? 'Unranked'}`}
                        className="focus-ring group relative flex min-w-0 items-center gap-4 rounded-[1.5rem] border border-[color-mix(in_srgb,var(--rank-accent)_28%,var(--border-subtle))] bg-[color-mix(in_srgb,var(--rank-accent)_6%,var(--surface-primary))] p-4 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--rank-accent)_52%,var(--border-strong))] hover:shadow-[0_18px_40px_color-mix(in_srgb,var(--rank-accent)_9%,transparent)] sm:gap-5 sm:p-6"
                        href="/seasons/ranks"
                    >
                        <span className="absolute top-4 right-4 grid size-8 place-items-center rounded-full border border-border-subtle bg-app/70 text-muted transition-colors group-hover:text-[var(--rank-accent)]" aria-hidden="true">
                            <ArrowUpRight size={15} />
                        </span>
                        {season.rank && (
                            <div className="relative grid size-20 shrink-0 place-items-center sm:size-36">
                                <span className="absolute inset-3 rounded-full bg-[var(--rank-accent)] opacity-10 blur-2xl" aria-hidden="true" />
                                <RankEmblem className="relative size-full drop-shadow-[0_0_22px_color-mix(in_srgb,var(--rank-accent)_30%,transparent)]" rank={season.rank} />
                            </div>
                        )}
                        <div className="min-w-0 flex-1 text-left">
                            <p className="text-[0.625rem] font-bold tracking-[0.18em] text-muted uppercase">{completedSeason ? 'Final Rank' : 'Current Rank'}</p>
                            <h2 className="mt-1 truncate text-3xl font-bold tracking-[-0.055em] text-[var(--rank-accent)] uppercase sm:mt-2 sm:text-5xl">
                                {season.rank?.displayName ?? 'Unranked'}
                            </h2>
                            <p className="mt-1 text-xl font-bold text-foreground sm:mt-2 sm:text-2xl">{season.seasonPoints.toLocaleString()} <span className="text-xs tracking-[0.08em] text-muted sm:text-sm">SP</span></p>
                            {!completedSeason && season.rank && <RankProgress className="mt-3 sm:mt-5" compact rank={season.rank} />}
                        </div>
                    </Link>

                    <section aria-label="Season calendar pulse" className="rounded-[1.5rem] border border-border-subtle bg-surface/78 p-5 sm:p-6">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="flex items-center gap-2 text-[0.625rem] font-bold tracking-[0.16em] text-muted uppercase">
                                    <CalendarDays aria-hidden="true" size={15} />
                                    Season Pulse
                                </p>
                                <p className="mt-2 text-3xl font-bold tracking-[-0.045em]">
                                    {completedSeason ? 'Complete' : `Day ${season.day}`}
                                    {!completedSeason && <span className="text-lg text-muted"> / 30</span>}
                                </p>
                            </div>
                            <p className="text-right text-xs font-bold tracking-[0.12em] text-secondary uppercase">
                                {completedSeason ? '30 days logged' : `${daysRemaining} days left`}
                            </p>
                        </div>

                        <div className="mt-6">
                            <SeasonDayTrack
                                currentDay={completedSeason ? null : season.day}
                                daysReached={daysReached}
                                label={`Season ${season.number}: day ${daysReached} of 30`}
                            />
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <PulseMetric
                                icon={<Target aria-hidden="true" size={16} />}
                                label="Objectives"
                                value={`${season.objectiveCompletedCount} / ${season.objectiveCount}`}
                            />
                            <PulseMetric
                                icon={season.objectiveSetupOpen ? <Clock3 aria-hidden="true" size={16} /> : <CheckCircle2 aria-hidden="true" size={16} />}
                                label="Objective set"
                                value={setupValue}
                            />
                        </div>
                    </section>
                </div>
            </Surface>

            <ObjectiveBoard
                creating={creatingObjective}
                onCreatingChange={setCreatingObjective}
                season={season}
            />
        </div>
    );
}
