import { router } from '@inertiajs/react';
import { CalendarDays, ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react';

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
        <Surface className="rounded-2xl p-3 sm:p-4" elevated>
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div aria-label="Statistics period" className="grid grid-cols-4 gap-1 rounded-xl bg-app p-1 lg:min-w-80" role="group">
                    {periods.map(([key, label]) => (
                        <button
                            aria-pressed={statistics.filter === key}
                            className={`focus-ring min-h-10 rounded-lg px-3 text-xs font-bold transition-colors ${statistics.filter === key ? 'bg-[var(--module-accent)] text-accent-foreground' : 'text-muted hover:bg-surface-hover hover:text-foreground'}`}
                            disabled={loading}
                            key={key}
                            onClick={() => visit({ statistics_period: key }, true)}
                            type="button"
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <PeriodNavigator loading={loading} statistics={statistics} visit={visit} />
            </div>
            <div className="mt-4 grid gap-3 border-t border-border-subtle pt-4 sm:grid-cols-2">
                <SelectField disabled={statistics.currencies.length < 2 || loading} label="Currency" onChange={(event) => visit({ currency: event.target.value, account: null })} options={statistics.currencies.length === 0 ? [{ label: 'No currency', value: '' }] : statistics.currencies.map((currency) => ({ label: currency, value: currency }))} value={statistics.currency ?? ''} />
                <SelectField disabled={statistics.accounts.length === 0 || loading} label="Account" onChange={(event) => visit({ account: event.target.value || null })} options={[{ label: 'All Accounts', value: '' }, ...statistics.accounts.map((account) => ({ label: `${account.name}${account.archived ? ' · Archived' : ''}`, value: String(account.id) }))]} value={statistics.accountId === null ? '' : String(statistics.accountId)} />
            </div>
        </Surface>
    );
}

function PeriodNavigator({ statistics, loading, visit }: { statistics: MoneyStatisticsData; loading: boolean; visit: (changes: Record<string, string | null>) => void }) {
    if (statistics.filter === 'all') {
        return <div className="min-w-36 text-center"><h2 className="inline-flex items-center gap-2 text-base font-bold">{loading ? <LoaderCircle aria-hidden="true" className="animate-spin" size={15} /> : <CalendarDays aria-hidden="true" className="text-muted" size={15} />}All time</h2><p aria-live="polite" className="mt-1 text-xs text-muted">Your complete money history</p></div>;
    }

    return (
        <div className="flex items-center justify-between gap-3 lg:justify-end">
            <button aria-label="Previous period" className="focus-ring grid size-11 shrink-0 place-items-center rounded-xl border border-border-subtle hover:bg-surface-hover disabled:opacity-30" disabled={!statistics.selector.previousValue || loading} onClick={() => visit({ statistics_value: statistics.selector.previousValue })} type="button"><ChevronLeft aria-hidden="true" size={18} /></button>
            <div className="min-w-36 flex-1 text-center lg:flex-none"><h2 className="inline-flex items-center gap-2 text-base font-bold">{loading ? <LoaderCircle aria-hidden="true" className="animate-spin" size={15} /> : <CalendarDays aria-hidden="true" className="text-muted" size={15} />}{statistics.label}</h2><p aria-live="polite" className="mt-1 text-xs text-muted">{loading ? 'Updating statistics…' : statistics.comparisonLabel}</p></div>
            <button aria-label="Next period" className="focus-ring grid size-11 shrink-0 place-items-center rounded-xl border border-border-subtle hover:bg-surface-hover disabled:opacity-30" disabled={!statistics.selector.nextValue || loading} onClick={() => visit({ statistics_value: statistics.selector.nextValue })} type="button"><ChevronRight aria-hidden="true" size={18} /></button>
        </div>
    );
}
