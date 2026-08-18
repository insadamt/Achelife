import type { CSSProperties } from 'react';

import type { RankViewData } from '../../features/seasons/types';
import { classNames } from '../ui/classNames';
import { rankAccents } from './rankPresentation';

interface RankBadgeProps {
    rank: RankViewData;
    compact?: boolean;
    className?: string;
}

export function RankBadge({ rank, compact = false, className }: RankBadgeProps) {
    const style = { '--rank-accent': rankAccents[rank.tier] } as CSSProperties;

    return (
        <span className={classNames('flex min-w-0 items-center gap-3', className)} style={style}>
            <span
                aria-hidden="true"
                className={classNames(
                    'grid shrink-0 rotate-45 place-items-center rounded-[0.3rem] border-2 border-[var(--rank-accent)] bg-[color-mix(in_srgb,var(--rank-accent)_10%,transparent)]',
                    compact ? 'size-7' : 'size-9',
                )}
            >
                <span className={classNames('block rotate-45 rounded-full bg-[var(--rank-accent)]', compact ? 'size-1.5' : 'size-2')} />
            </span>
            <span
                className={classNames(
                    'min-w-0 font-bold tracking-[-0.035em] text-[var(--rank-accent)] uppercase',
                    compact ? 'text-lg leading-none' : 'text-[clamp(1.75rem,5vw,3rem)] leading-[0.95]',
                )}
            >
                {rank.displayName}
            </span>
        </span>
    );
}
