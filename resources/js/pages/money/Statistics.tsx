import { Head } from '@inertiajs/react';
import { useState } from 'react';
import type { CSSProperties } from 'react';

import { MoneyAccountStatistics } from '../../features/money/MoneyAccountStatistics';
import { MoneyBreakdownPanel } from '../../features/money/MoneyBreakdownPanel';
import { MoneyCashFlowChart } from '../../features/money/MoneyCashFlowChart';
import { MoneyPageHeader } from '../../features/money/MoneyPageHeader';
import { MoneyStatisticCards } from '../../features/money/MoneyStatisticCards';
import { MoneyStatisticsToolbar } from '../../features/money/MoneyStatisticsToolbar';
import type { MoneyStatisticsData } from '../../features/money/statisticsTypes';

export default function MoneyStatisticsPage({ statistics }: { statistics: MoneyStatisticsData }) {
    const [loading, setLoading] = useState(false);

    return (
        <div style={{ '--module-accent': 'var(--money-accent)' } as CSSProperties}>
            <Head title="Money statistics" />
            <MoneyPageHeader active="statistics" description="See where money enters, where it goes, and how your cash flow changes." title="Statistics" />
            <section aria-busy={loading} className={`space-y-5 transition-opacity ${loading ? 'pointer-events-none opacity-60' : 'opacity-100'}`}>
                <MoneyStatisticsToolbar loading={loading} setLoading={setLoading} statistics={statistics} />
                {statistics.currency === null ? <div className="grid min-h-72 place-items-center rounded-[2rem] border border-dashed border-border-strong bg-surface p-6 text-center"><div><p className="text-xl font-bold">Create an Account to begin</p><p className="mt-2 text-sm text-muted">Statistics are calculated separately for each Account currency.</p></div></div> : <>
                    <MoneyStatisticCards statistics={statistics} />
                    <MoneyCashFlowChart statistics={statistics} />
                    <MoneyBreakdownPanel statistics={statistics} type="expense" />
                    <details className="group rounded-[var(--radius-panel)] border border-border-subtle bg-surface">
                        <summary className="focus-ring flex min-h-14 cursor-pointer list-none items-center justify-between rounded-[var(--radius-panel)] px-4 text-sm font-bold hover:bg-surface-hover sm:px-5">
                            More insights
                            <span className="text-xs font-semibold text-muted group-open:hidden">Income sources, Accounts, and highlights</span>
                            <span className="hidden text-xs font-semibold text-muted group-open:inline">Hide details</span>
                        </summary>
                        <div className="space-y-4 border-t border-border-subtle p-3 sm:p-4">
                            <MoneyBreakdownPanel statistics={statistics} type="income" />
                            <MoneyAccountStatistics statistics={statistics} />
                        </div>
                    </details>
                </>}
            </section>
        </div>
    );
}
