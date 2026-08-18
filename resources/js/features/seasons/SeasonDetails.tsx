import { useState } from 'react';

import { SeasonRankSummary } from '../../components/rank';
import { StatusChip, Surface } from '../../components/ui';
import { classNames } from '../../components/ui/classNames';
import { formatFullDate, formatSeasonRange } from './dateFormat';
import { ObjectiveBoard } from './ObjectiveBoard';
import { SegmentedSeasonProgress } from './SegmentedSeasonProgress';
import type { SeasonViewData } from './types';

type SeasonDetailView = 'overview' | 'objectives';

function Overview({ season }: { season: SeasonViewData }) {
    const completedDays = season.state === 'completed' ? 30 : (season.day ?? 0);

    return (
        <div>
            <div>
                <h3 className="text-3xl font-bold tracking-[-0.045em] sm:text-4xl">
                    {season.state === 'current' ? `Day ${season.day} of 30` : 'Season complete'}
                </h3>
                <p className="mt-3 text-base font-semibold text-secondary">{formatSeasonRange(season.startDate, season.endDate)}</p>
                <p className="sr-only">
                    From {formatFullDate(season.startDate)} through {formatFullDate(season.endDate)}.
                </p>

                <div className="mt-9">
                    <div className="mb-4 flex items-end justify-between gap-4">
                        <div>
                            <p className="text-xs font-bold tracking-[0.15em] text-muted uppercase">30-day progression</p>
                            <p className="mt-1 text-sm text-secondary">
                                {season.state === 'current' ? `${30 - completedDays} calendar days remain` : 'All 30 calendar days completed'}
                            </p>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{season.progressPercentage}%</p>
                    </div>
                    <SegmentedSeasonProgress completedDays={completedDays} label={`Season ${season.number} progress: ${completedDays} of 30 days`} />
                </div>
            </div>
        </div>
    );
}

export function SeasonDetails({ season }: { season: SeasonViewData }) {
    const [detailView, setDetailView] = useState<SeasonDetailView>('overview');

    return (
        <Surface
            accent="var(--season-accent)"
            aria-live="polite"
            className="relative overflow-hidden p-5 sm:p-8 lg:p-10"
            elevated
        >
            <div
                className="pointer-events-none absolute top-0 right-0 h-56 w-56 translate-x-1/3 -translate-y-1/3 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--module-accent)_13%,transparent),transparent_70%)]"
                aria-hidden="true"
            />

            <div className="relative">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                        <p className="text-xs font-bold tracking-[0.2em] text-[var(--module-accent)] uppercase">
                            Season {String(season.number).padStart(2, '0')}
                        </p>
                        <StatusChip status={season.state === 'current' ? 'active' : 'completed'}>
                            {season.state === 'current' ? 'Current' : 'Completed'}
                        </StatusChip>
                    </div>
                    <div className="text-left sm:text-right">
                        <p className="text-[0.625rem] font-bold tracking-[0.14em] text-muted uppercase">
                            {season.state === 'current' ? 'Current day' : 'Status'}
                        </p>
                        <p className="mt-1 text-lg font-bold">{season.state === 'current' ? `${season.day} / 30` : 'Complete'}</p>
                    </div>
                </div>

                {season.rank && (
                    <SeasonRankSummary
                        className="mt-7"
                        completed={season.state === 'completed'}
                        rank={season.rank}
                        seasonPoints={season.seasonPoints}
                    />
                )}

                <div className="my-7 flex border-b border-border-subtle" role="tablist" aria-label="Season details views">
                    {(['overview', 'objectives'] as const).map((view) => (
                        <button
                            aria-controls={`season-${season.number}-${view}`}
                            aria-selected={detailView === view}
                            className={classNames(
                                'focus-ring relative min-h-12 px-4 text-xs font-bold tracking-[0.16em] uppercase transition-colors sm:px-6',
                                detailView === view ? 'text-foreground' : 'text-muted hover:text-secondary',
                            )}
                            id={`season-${season.number}-${view}-tab`}
                            key={view}
                            onClick={() => setDetailView(view)}
                            role="tab"
                            type="button"
                        >
                            {view}
                            {view === 'objectives' && (
                                <span className="ml-2 text-[var(--module-accent)]">
                                    {season.objectiveCompletedCount}/{season.objectiveCount}
                                </span>
                            )}
                            {detailView === view && <span className="absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-[var(--module-accent)]" />}
                        </button>
                    ))}
                </div>

                <div
                    aria-labelledby={`season-${season.number}-${detailView}-tab`}
                    id={`season-${season.number}-${detailView}`}
                    role="tabpanel"
                >
                    {detailView === 'overview' ? <Overview season={season} /> : <ObjectiveBoard season={season} />}
                </div>
            </div>
        </Surface>
    );
}
