import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react';

import { SelectField, Surface } from '../../components/ui';
import type { MoneyStatisticsData, MoneyStatisticsPeriod } from './statisticsTypes';

const periods: Array<[MoneyStatisticsPeriod, string]> = [['season', 'Season'], ['month', 'Month'], ['year', 'Year'], ['all', 'All time']];

export function MoneyStatisticsToolbar({ statistics, loading, setLoading }: { statistics: MoneyStatisticsData; loading: boolean; setLoading: (value: boolean) => void }) {
    function visit(changes: Record<string, string | null>, resetPeriod = false) {
        const url = new URL(window.location.href);
        for (const [key, value] of Object.entries(changes)) {
            if (value === null || value === '') url.searchParams.delete(key);
            else url.searchParams.set(key, value);
        }
        if (resetPeriod) url.searchParams.delete('statistics_value');
        router.get(`${url.pathname}${url.search}`, {}, {
            only: ['statistics'],
            preserveScroll: true,
            preserveState: true,
            onStart: () => setLoading(true),
            onFinish: () => setLoading(false),
        });
    }

    return (
        <div className="space-y-4">
            <Surface className="overflow-hidden p-1">
                <div aria-label="Statistics period" className="grid grid-cols-4 gap-1" role="group">
                    {periods.map(([key, label]) => (
                        <button
                            aria-pressed={statistics.filter === key}
                            className={`focus-ring min-h-11 rounded-[1.35rem] px-2 text-sm font-bold transition-all ${statistics.filter === key ? 'bg-[var(--module-accent)] text-accent-foreground shadow-lg' : 'text-muted hover:bg-surface-hover hover:text-foreground'}`}
                            disabled={loading}
                            key={key}
                            onClick={() => visit({ statistics_period: key }, true)}
                            type="button"
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </Surface>
            <div className="grid gap-4 lg:grid-cols-[minmax(16rem,1fr)_14rem_16rem] lg:items-end">
                <PeriodNavigator loading={loading} statistics={statistics} visit={visit} />
                <SelectField disabled={statistics.currencies.length < 2 || loading} label="Currency" onChange={(event) => visit({ currency: event.target.value, account: null })} options={statistics.currencies.length === 0 ? [{ label: 'No currency', value: '' }] : statistics.currencies.map((currency) => ({ label: currency, value: currency }))} value={statistics.currency ?? ''} />
                <SelectField disabled={statistics.accounts.length === 0 || loading} label="Account" onChange={(event) => visit({ account: event.target.value || null })} options={[{ label: 'All Accounts', value: '' }, ...statistics.accounts.map((account) => ({ label: `${account.name}${account.archived ? ' · Archived' : ''}`, value: String(account.id) }))]} value={statistics.accountId === null ? '' : String(statistics.accountId)} />
            </div>
        </div>
    );
}

function PeriodNavigator({ statistics, loading, visit }: { statistics: MoneyStatisticsData; loading: boolean; visit: (changes: Record<string, string | null>) => void }) {
    if (statistics.filter === 'all') {
        return <div className="text-center"><p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-ink">Selected period</p><h2 className="mt-1 text-2xl font-bold">All time</h2></div>;
    }

    return (
        <div className="flex items-center justify-center">
            <div className="grid grid-cols-[2.75rem_minmax(11rem,1fr)_2.75rem] items-center gap-2">
                <button aria-label="Previous period" className="focus-ring grid size-11 place-items-center rounded-full border border-border-subtle bg-surface hover:bg-surface-hover disabled:opacity-30" disabled={!statistics.selector.previousValue || loading} onClick={() => visit({ statistics_value: statistics.selector.previousValue })} type="button"><ChevronLeft size={20} /></button>
                <div className="text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-ink">Selected period</p>
                    <h2 className="mt-1 flex items-center justify-center gap-2 text-2xl font-bold">{loading && <LoaderCircle className="animate-spin" size={17} />}{statistics.label}</h2>
                    <p className="mt-1 text-xs font-semibold text-muted">{statistics.comparisonLabel}</p>
                </div>
                <button aria-label="Next period" className="focus-ring grid size-11 place-items-center rounded-full border border-border-subtle bg-surface hover:bg-surface-hover disabled:opacity-30" disabled={!statistics.selector.nextValue || loading} onClick={() => visit({ statistics_value: statistics.selector.nextValue })} type="button"><ChevronRight size={20} /></button>
            </div>
        </div>
    );
}
