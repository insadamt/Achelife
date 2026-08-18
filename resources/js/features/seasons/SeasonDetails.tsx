import { StatusChip, Surface } from '../../components/ui';
import { formatFullDate, formatSeasonRange } from './dateFormat';
import { SegmentedSeasonProgress } from './SegmentedSeasonProgress';
import type { SeasonViewData } from './types';

export function SeasonDetails({ season }: { season: SeasonViewData }) {
    const completedDays = season.state === 'completed' ? 30 : (season.day ?? 0);

    return (
        <Surface
            accent="var(--season-accent)"
            aria-live="polite"
            className="relative overflow-hidden p-5 sm:p-8 lg:p-10"
            elevated
        >
            <div className="pointer-events-none absolute top-0 right-0 h-56 w-56 translate-x-1/3 -translate-y-1/3 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--module-accent)_13%,transparent),transparent_70%)]" aria-hidden="true" />

            <div className="relative grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:gap-12">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <p className="text-xs font-bold tracking-[0.2em] text-[var(--module-accent)] uppercase">
                            Season {String(season.number).padStart(2, '0')}
                        </p>
                        <StatusChip status={season.state === 'current' ? 'active' : 'completed'}>
                            {season.state === 'current' ? 'Current' : 'Completed'}
                        </StatusChip>
                    </div>

                    <h2 className="mt-5 text-4xl font-bold tracking-[-0.045em] sm:text-5xl">
                        {season.state === 'current' ? `Day ${season.day} of 30` : 'Season complete'}
                    </h2>
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

                <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border-subtle bg-border-subtle lg:grid-cols-1">
                    <div className="bg-surface p-5 sm:p-6">
                        <dt className="text-[0.625rem] font-bold tracking-[0.17em] text-muted uppercase">
                            {season.state === 'completed' ? 'Final Season SP' : 'Season SP'}
                        </dt>
                        <dd className="mt-2 text-4xl font-bold tracking-[-0.04em] text-foreground">{season.seasonPoints.toLocaleString()}</dd>
                    </div>
                    <div className="bg-surface p-5 sm:p-6">
                        <dt className="text-[0.625rem] font-bold tracking-[0.17em] text-muted uppercase">Rank</dt>
                        <dd className="mt-2 text-4xl font-bold tracking-[-0.04em] text-foreground">{season.rank ?? '—'}</dd>
                        {!season.rank && <p className="mt-2 text-xs text-muted">Rank system pending</p>}
                    </div>
                </dl>
            </div>
        </Surface>
    );
}
