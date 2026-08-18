import type { RankViewData } from '../../features/seasons/types';
import { ProgressBar } from '../ui';
import { classNames } from '../ui/classNames';
import { rankAccents } from './rankPresentation';

interface RankProgressProps {
    rank: RankViewData;
    compact?: boolean;
    className?: string;
}

export function RankProgress({ rank, compact = false, className }: RankProgressProps) {
    if (rank.topRank) {
        return <p className={classNames('text-xs font-bold tracking-[0.16em] text-secondary uppercase', className)}>Top Rank</p>;
    }

    if (rank.progressCurrent === null || rank.progressRequired === null) {
        return (
            <p className={classNames('text-xs font-bold tracking-[0.12em] text-secondary uppercase', className)}>
                {rank.spToNext?.toLocaleString()} SP to {rank.nextRank}
            </p>
        );
    }

    return (
        <div className={className}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs font-bold tracking-[0.1em] uppercase">
                <span className="text-foreground">
                    {rank.progressCurrent} / {rank.progressRequired} SP
                </span>
                <span className="text-secondary">
                    {rank.spToNext} SP to {rank.nextRank}
                </span>
            </div>
            <ProgressBar
                accent={rankAccents[rank.tier]}
                activeGlow={!compact}
                ariaLabel={`${rank.displayName} progress toward ${rank.nextRank}`}
                maximum={rank.progressRequired}
                showValue={false}
                value={rank.progressCurrent}
            />
        </div>
    );
}
