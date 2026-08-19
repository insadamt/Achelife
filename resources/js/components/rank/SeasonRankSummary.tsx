import type { RankViewData } from '../../features/seasons/types';
import { classNames } from '../ui/classNames';
import { RankBadge } from './RankBadge';
import { RankProgress } from './RankProgress';

interface SeasonRankSummaryProps {
    rank: RankViewData;
    seasonPoints: number;
    completed?: boolean;
    compact?: boolean;
    className?: string;
}

export function SeasonRankSummary({ rank, seasonPoints, completed = false, compact = false, className }: SeasonRankSummaryProps) {
    if (completed) {
        return (
            <dl className={classNames('grid gap-px overflow-hidden rounded-2xl border border-border-subtle bg-border-subtle sm:grid-cols-2', className)}>
                <div className="min-w-0 bg-surface p-4 sm:p-5">
                    <dt className="text-[0.625rem] font-bold tracking-[0.17em] text-muted uppercase">Final Rank</dt>
                    <dd className="mt-3"><RankBadge rank={rank} size="medium" /></dd>
                </div>
                <div className="bg-surface p-4 sm:p-5">
                    <dt className="text-[0.625rem] font-bold tracking-[0.17em] text-muted uppercase">Final SP</dt>
                    <dd className="mt-2 text-3xl font-bold tracking-[-0.04em] text-foreground sm:text-4xl">{seasonPoints.toLocaleString()}</dd>
                </div>
            </dl>
        );
    }

    return (
        <div className={classNames('min-w-0', className)}>
            <div className="flex flex-wrap items-end justify-between gap-3">
                <RankBadge rank={rank} size={compact ? 'medium' : 'large'} />
                <p className={classNames('shrink-0 font-bold tracking-[-0.025em] text-foreground', compact ? 'text-xl' : 'text-2xl')}>
                    {seasonPoints.toLocaleString()} SP
                </p>
            </div>
            <RankProgress className={compact ? 'mt-3' : 'mt-5'} compact={compact} rank={rank} />
        </div>
    );
}
