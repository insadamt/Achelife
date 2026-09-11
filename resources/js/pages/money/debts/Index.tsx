import { Head } from '@inertiajs/react';
import { AlertTriangle, HandCoins } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';

import { Surface } from '../../../components/ui';
import { DebtCard } from '../../../features/money/DebtCard';
import { DebtComposerDrawer } from '../../../features/money/DebtComposerDrawer';
import { DebtRepaymentDrawer } from '../../../features/money/DebtRepaymentDrawer';
import { MoneyPageHeader } from '../../../features/money/MoneyPageHeader';
import { MoneyFloatingActionMenu } from '../../../features/money/MoneyFloatingActionMenu';
import { formatMinorUnits } from '../../../features/money/moneyPresentation';
import type { MoneyDebtAccountOption, MoneyDebtData, MoneyDebtPersonData } from '../../../features/money/types';

type DebtView = 'active' | 'payable' | 'receivable' | 'settled';

interface DebtPageProps {
    today: string;
    accounts: MoneyDebtAccountOption[];
    people: MoneyDebtPersonData[];
    debts: MoneyDebtData[];
    totalsByCurrency: Record<string, { payable: number; receivable: number }>;
}

const views: Array<{ value: DebtView; label: string }> = [
    { value: 'active', label: 'Active' },
    { value: 'payable', label: 'You owe' },
    { value: 'receivable', label: 'Owed to you' },
    { value: 'settled', label: 'Settled' },
];

export default function DebtIndex(props: DebtPageProps) {
    const [view, setView] = useState<DebtView>('active');
    const [composerOpen, setComposerOpen] = useState(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('create') === '1');
    const [repayingDebt, setRepayingDebt] = useState<MoneyDebtData | null>(null);
    const visibleDebts = useMemo(() => props.debts.filter((debt) => {
        if (view === 'active') return debt.status !== 'settled';
        if (view === 'settled') return debt.status === 'settled';
        return debt.status !== 'settled' && debt.direction === view;
    }), [props.debts, view]);
    const overdueCount = props.debts.filter((debt) => debt.status === 'overdue').length;

    return (
        <div style={{ '--module-accent': 'var(--money-accent)' } as CSSProperties}>
            <Head title="Money Debts" />
            <MoneyPageHeader active="debts" description="Track what you owe and what is owed to you without mixing principal into income or spending." title="Debts" />

            {Object.keys(props.totalsByCurrency).length > 0 ? (
                <Surface className="divide-y divide-border-subtle px-4" elevated>
                    {Object.entries(props.totalsByCurrency).map(([currency, totals]) => (
                        <div className="grid gap-4 py-4 sm:grid-cols-[5rem_1fr_1fr] sm:items-center" key={currency}>
                            <p className="text-xs font-bold text-accent-ink">{currency}</p>
                            <div><p className="text-xs text-muted">You owe</p><p className="mt-0.5 text-xl font-bold tabular-nums">{formatMinorUnits(totals.payable, currency)}</p></div>
                            <div><p className="text-xs text-muted">Owed to you</p><p className="mt-0.5 text-xl font-bold text-success tabular-nums">{formatMinorUnits(totals.receivable, currency)}</p></div>
                        </div>
                    ))}
                    {overdueCount > 0 && <p className="flex items-center gap-2 py-3 text-sm font-bold text-warning"><AlertTriangle aria-hidden="true" size={16} />{overdueCount} overdue {overdueCount === 1 ? 'debt needs' : 'debts need'} attention</p>}
                </Surface>
            ) : (
                <Surface className="p-5 text-sm text-muted" elevated>No outstanding debts.</Surface>
            )}

            <div className="my-6">
                <div aria-label="Debt views" className="flex max-w-full gap-1 overflow-x-auto border-b border-border-subtle" role="group">
                    {views.map((item) => <button aria-pressed={view === item.value} className={`focus-ring shrink-0 border-b-2 px-3 py-3 text-sm font-bold ${view === item.value ? 'border-[var(--money-accent)] text-foreground' : 'border-transparent text-muted hover:text-foreground'}`} key={item.value} onClick={() => setView(item.value)} type="button">{item.label}</button>)}
                </div>
            </div>

            {visibleDebts.length > 0 ? <div className="grid gap-3">{visibleDebts.map((debt) => <DebtCard debt={debt} key={debt.id} onRepay={() => setRepayingDebt(debt)} />)}</div> : (
                <Surface className="grid min-h-64 place-items-center p-8 text-center" elevated><div><HandCoins className="mx-auto text-muted" size={28} /><p className="mt-3 text-2xl font-bold">Nothing here</p><p className="mt-2 text-muted">This debt view is clear.</p></div></Surface>
            )}

            {composerOpen && <DebtComposerDrawer accounts={props.accounts} onClose={() => setComposerOpen(false)} people={props.people} today={props.today} />}
            {repayingDebt && <DebtRepaymentDrawer accounts={props.accounts} debt={repayingDebt} onClose={() => setRepayingDebt(null)} today={props.today} />}
            {!composerOpen && !repayingDebt && <MoneyFloatingActionMenu actions={[{ icon: HandCoins, label: 'New debt', onSelect: () => setComposerOpen(true) }]} />}
        </div>
    );
}
