import { Head } from '@inertiajs/react';
import { useState } from 'react';
import type { CSSProperties } from 'react';

import { MoneyAccountStatistics } from '../../features/money/MoneyAccountStatistics';
import { MoneyBreakdownPanel } from '../../features/money/MoneyBreakdownPanel';
import { MoneyCashFlowChart } from '../../features/money/MoneyCashFlowChart';
import { MoneySectionNav } from '../../features/money/MoneySectionNav';
import { MoneyStatisticCards } from '../../features/money/MoneyStatisticCards';
import { MoneyStatisticsToolbar } from '../../features/money/MoneyStatisticsToolbar';
import type { MoneyStatisticsData } from '../../features/money/statisticsTypes';

export default function MoneyStatisticsPage({ statistics }: { statistics: MoneyStatisticsData }) {
    const [loading, setLoading] = useState(false);

    return (
        <div style={{ '--module-accent': 'var(--money-accent)' } as CSSProperties}>
            <Head title="Money statistics" />
            <header className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-accent-ink">Money</p><h1 className="text-4xl font-bold tracking-[-0.05em] sm:text-5xl">Money statistics</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted">See where money enters, where it goes, and how your cash flow changes.</p></div>
                <MoneySectionNav active="statistics" />
            </header>
            <section aria-busy={loading} className={`space-y-5 transition-opacity ${loading ? 'pointer-events-none opacity-60' : 'opacity-100'}`}>
                <MoneyStatisticsToolbar loading={loading} setLoading={setLoading} statistics={statistics} />
                {statistics.currency === null ? <div className="grid min-h-72 place-items-center rounded-[2rem] border border-dashed border-border-strong bg-surface p-6 text-center"><div><p className="text-xl font-bold">Create an Account to begin</p><p className="mt-2 text-sm text-muted">Statistics are calculated separately for each Account currency.</p></div></div> : <><MoneyStatisticCards statistics={statistics} /><MoneyCashFlowChart statistics={statistics} /><div className="grid gap-4 xl:grid-cols-2"><MoneyBreakdownPanel statistics={statistics} type="expense" /><MoneyBreakdownPanel statistics={statistics} type="income" /></div><MoneyAccountStatistics statistics={statistics} /></>}
            </section>
        </div>
    );
}
