import type { CSSProperties } from 'react';

import type { RankViewData } from '../../features/seasons/types';
import { classNames } from '../ui/classNames';
import { RankEmblem } from './RankEmblem';
import { rankAccents } from './rankPresentation';

interface RankBadgeProps {
    rank: RankViewData;
    size?: RankBadgeSize;
    className?: string;
}

export type RankBadgeSize = 'small' | 'medium' | 'large' | 'hero';

const emblemSizeClasses: Record<RankBadgeSize, string> = {
    small: 'size-10',
    medium: 'size-12 sm:size-14',
    large: 'size-16 sm:size-20',
    hero: 'size-20 sm:size-24',
};

const labelSizeClasses: Record<RankBadgeSize, string> = {
    small: 'text-[1.05rem] leading-none',
    medium: 'text-xl leading-none sm:text-2xl',
    large: 'text-[clamp(1.75rem,5vw,3rem)] leading-[0.95]',
    hero: 'text-[clamp(1.75rem,6vw,3.5rem)] leading-[0.92]',
};

const gapClasses: Record<RankBadgeSize, string> = {
    small: 'gap-3',
    medium: 'gap-3.5',
    large: 'gap-4',
    hero: 'gap-4 sm:gap-5',
};

export function RankBadge({ rank, size = 'large', className }: RankBadgeProps) {
    const style = { '--rank-accent': rankAccents[rank.tier] } as CSSProperties;

    return (
        <span className={classNames('flex min-w-0 items-center', gapClasses[size], className)} style={style}>
            <span className={classNames('relative grid shrink-0 place-items-center', emblemSizeClasses[size])}>
                <span
                    aria-hidden="true"
                    className="absolute inset-1 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--rank-accent)_18%,transparent),transparent_70%)] blur-md"
                />
                <RankEmblem className="relative size-full drop-shadow-[0_0_12px_color-mix(in_srgb,var(--rank-accent)_22%,transparent)]" rank={rank} />
            </span>
            <span
                className={classNames(
                    'min-w-0 font-bold tracking-[-0.035em] text-[var(--rank-accent)] uppercase',
                    labelSizeClasses[size],
                )}
            >
                {rank.displayName}
            </span>
        </span>
    );
}
