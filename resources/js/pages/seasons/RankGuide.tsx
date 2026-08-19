import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import type { CSSProperties } from 'react';

import { RankBadge } from '../../components/rank';
import { rankAccents } from '../../components/rank/rankPresentation';
import { Surface } from '../../components/ui';
import { classNames } from '../../components/ui/classNames';
import type { RankTier, RankViewData } from '../../features/seasons/types';
import type { SharedPageProps } from '../../types';

interface RankGuideProps {
    ranks: RankViewData[];
}

const tierOrder: RankTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'master', 'grandmaster', 'legend'];

function formatThreshold(rank: RankViewData) {
    if (rank.minimumSp === null) return 'Below 0 SP';

    return rank.topRank ? `${rank.minimumSp.toLocaleString()}+ SP` : `${rank.minimumSp.toLocaleString()} SP`;
}

export default function RankGuide({ ranks }: RankGuideProps) {
    const currentRankKey = usePage<SharedPageProps>().props.progressPanel?.season.rank?.key;
    const ranksByTier = tierOrder.map((tier) => ({ tier, ranks: ranks.filter((rank) => rank.tier === tier) }));

    return (
        <div style={{ '--module-accent': 'var(--season-accent)' } as CSSProperties}>
            <Head title="Season Rank Guide" />

            <div className="mx-auto max-w-4xl">
                <header className="text-center">
                    <Link
                        aria-label="Back to Seasons"
                        className="focus-ring mx-auto grid size-11 place-items-center rounded-full text-secondary transition-colors hover:bg-surface-hover hover:text-foreground"
                        href="/seasons"
                        title="Back to Seasons"
                    >
                        <ArrowLeft aria-hidden="true" size={20} />
                    </Link>
                    <p className="mt-5 text-xs font-bold tracking-[0.22em] text-[var(--module-accent)] uppercase">Season progression</p>
                    <h1 className="mt-3 text-4xl font-bold tracking-[-0.05em] sm:text-6xl">Rank guide</h1>
                    <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-secondary sm:text-base">
                        Earn Season Points to move through every division. Each new rank begins 100 SP after the last, with Legend waiting at the summit.
                    </p>
                </header>

                <Surface className="mt-8 overflow-hidden p-5 sm:p-8" elevated>
                    <div className="flex flex-col gap-3 border-b border-border-subtle pb-6 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-xs font-bold tracking-[0.16em] text-muted uppercase">Complete path</p>
                            <p className="mt-2 text-2xl font-bold tracking-[-0.035em]">22 ranked milestones</p>
                        </div>
                        <p className="text-sm font-semibold text-secondary">Bronze I · 0 SP → Legend · 2,100 SP</p>
                    </div>

                    <div className="mt-8 space-y-10">
                        {ranksByTier.map(({ tier, ranks: tierRanks }, tierIndex) => (
                            <section aria-labelledby={`rank-tier-${tier}`} key={tier}>
                                <div className="mb-3 flex items-center gap-3">
                                    <span className="text-[0.625rem] font-bold tracking-[0.16em] text-muted">{String(tierIndex + 1).padStart(2, '0')}</span>
                                    <h2 className="text-sm font-bold tracking-[0.18em] uppercase" id={`rank-tier-${tier}`}>
                                        {tier}
                                    </h2>
                                    <span className="h-px flex-1 bg-border-subtle" />
                                </div>

                                <div className="relative">
                                    {tierRanks.length > 1 && <span aria-hidden="true" className="absolute top-14 bottom-14 left-14 w-px bg-border-strong sm:left-[4.25rem]" />}
                                    <div className="space-y-3">
                                        {tierRanks.map((rank) => {
                                            const current = rank.key === currentRankKey;

                                            return (
                                                <div
                                                    className={classNames(
                                                        'relative grid min-h-28 grid-cols-[minmax(0,1fr)] items-center gap-x-6 gap-y-1 rounded-3xl border px-4 py-4 transition-[background-color,border-color,box-shadow] sm:min-h-32 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-5',
                                                        current
                                                            ? 'border-[color-mix(in_srgb,var(--rank-accent)_52%,var(--border-strong))] bg-[color-mix(in_srgb,var(--rank-accent)_9%,transparent)] shadow-[0_14px_36px_color-mix(in_srgb,var(--rank-accent)_10%,transparent)]'
                                                            : 'border-border-subtle bg-app/20 hover:border-[color-mix(in_srgb,var(--rank-accent)_28%,var(--border-subtle))] hover:bg-surface-hover/55',
                                                    )}
                                                    key={rank.key}
                                                    style={{ '--rank-accent': rankAccents[rank.tier] } as CSSProperties}
                                                >
                                                    <div className="relative z-10 min-w-0">
                                                        <RankBadge rank={rank} size="hero" />
                                                        {current && <p className="mt-1 pl-24 text-[0.625rem] font-bold tracking-[0.16em] text-[var(--rank-accent)] uppercase sm:pl-[7.25rem]">Your current rank</p>}
                                                    </div>

                                                    <div className="pl-24 sm:col-start-2 sm:row-start-1 sm:self-center sm:pl-0 sm:text-right">
                                                        <p className="text-[0.625rem] font-bold tracking-[0.14em] text-muted uppercase">Unlocks at</p>
                                                        <p className="mt-1 whitespace-nowrap text-base font-bold tabular-nums sm:text-lg">{formatThreshold(rank)}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </section>
                        ))}
                    </div>
                </Surface>

                <p className="mt-5 text-center text-xs leading-5 text-muted">
                    Negative Season SP is Unranked. Legend has no ceiling and continues beyond 2,100 SP.
                </p>
            </div>
        </div>
    );
}
