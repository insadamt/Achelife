import type { CSSProperties, SVGProps } from 'react';

import type { RankViewData } from '../../features/seasons/types';
import { classNames } from '../ui/classNames';
import { rankAccents } from './rankPresentation';

type RankIdentity = Pick<RankViewData, 'division' | 'tier'>;

interface RankEmblemProps extends Omit<SVGProps<SVGSVGElement>, 'rank'> {
    rank: RankIdentity;
}

function DivisionCore({ rank }: { rank: RankIdentity }) {
    if (rank.tier === 'unranked') {
        return <circle cx="32" cy="32" fill="none" r="3.5" stroke="currentColor" strokeWidth="2" />;
    }

    if (rank.tier === 'legend') {
        return <path d="M32 20 35.5 28.5 44 32l-8.5 3.5L32 44l-3.5-8.5L20 32l8.5-3.5L32 20Z" fill="currentColor" />;
    }

    if (rank.division === 'III') {
        return (
            <g>
                <path d="M32 22.5 41.5 32 32 41.5 22.5 32 32 22.5Z" fill="none" stroke="currentColor" strokeWidth="2" />
                <circle cx="32" cy="32" fill="currentColor" r="2.5" />
            </g>
        );
    }

    if (rank.division === 'II') {
        return (
            <g>
                <circle cx="32" cy="32" fill="none" r="7" stroke="currentColor" strokeWidth="2" />
                <circle cx="32" cy="32" fill="currentColor" r="2.5" />
            </g>
        );
    }

    return <circle cx="32" cy="32" fill="currentColor" r="3.5" />;
}

function TierDetail({ tier }: Pick<RankIdentity, 'tier'>) {
    if (tier === 'silver') {
        return <path d="m38.5 50.5 12-12" opacity="0.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />;
    }

    if (tier === 'gold') {
        return (
            <g opacity="0.7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5">
                <path d="m13.5 25.5 12-12" />
                <path d="m38.5 50.5 12-12" />
            </g>
        );
    }

    if (tier === 'platinum') {
        return (
            <g fill="currentColor">
                <circle cx="12.5" cy="32" r="1.5" />
                <circle cx="32" cy="12.5" r="1.5" />
                <circle cx="51.5" cy="32" r="1.5" />
                <circle cx="32" cy="51.5" r="1.5" />
            </g>
        );
    }

    if (tier === 'diamond') {
        return (
            <g fill="none" opacity="0.6" stroke="currentColor" strokeWidth="1.25">
                <path d="m12 32 9-9M43 23l9 9M52 32l-9 9M21 41l-9-9" />
            </g>
        );
    }

    if (tier === 'master') {
        return (
            <g fill="currentColor">
                <path d="M32 1.5 35.5 5 32 8.5 28.5 5 32 1.5Z" />
                <path d="m32 55.5 3.5 3.5-3.5 3.5-3.5-3.5 3.5-3.5Z" />
            </g>
        );
    }

    if (tier === 'grandmaster') {
        return (
            <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                <path d="m9 24-6 8 6 8" />
                <path d="m55 24 6 8-6 8" />
            </g>
        );
    }

    if (tier === 'legend') {
        return (
            <g fill="none" stroke="currentColor" strokeLinecap="round">
                <path d="M32 13.5 50.5 32 32 50.5 13.5 32 32 13.5Z" opacity="0.7" strokeWidth="1.5" />
                <path d="M32 0v4M32 60v4M0 32h4M60 32h4" opacity="0.8" strokeWidth="2" />
            </g>
        );
    }

    return null;
}

export function RankEmblem({ rank, className, style, ...props }: RankEmblemProps) {
    const emblemStyle = { color: rankAccents[rank.tier], ...style } as CSSProperties;

    return (
        <svg
            aria-hidden="true"
            className={classNames('overflow-visible', className)}
            fill="none"
            style={emblemStyle}
            viewBox="0 0 64 64"
            {...props}
        >
            <path
                d="M32 7c1.2 0 2.3.5 3.1 1.3l20.6 20.6a4.4 4.4 0 0 1 0 6.2L35.1 55.7a4.4 4.4 0 0 1-6.2 0L8.3 35.1a4.4 4.4 0 0 1 0-6.2L28.9 8.3A4.4 4.4 0 0 1 32 7Z"
                fill="currentColor"
                fillOpacity="0.08"
                stroke="currentColor"
                strokeDasharray={rank.tier === 'unranked' ? '5 4' : undefined}
                strokeWidth="2.5"
            />
            <TierDetail tier={rank.tier} />
            <DivisionCore rank={rank} />
        </svg>
    );
}
