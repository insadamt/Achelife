import { Head } from '@inertiajs/react';
import { HandCoins, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';

import { Button, Surface } from '../../../components/ui';
import { DebtCard } from '../../../features/money/DebtCard';
import { DebtComposerDrawer } from '../../../features/money/DebtComposerDrawer';
import { DebtRepaymentDrawer } from '../../../features/money/DebtRepaymentDrawer';
import { MoneySectionNav } from '../../../features/money/MoneySectionNav';
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
    const [composerOpen, setComposerOpen] = useState(false);
    const [repayingDebt, setRepayingDebt] = useState<MoneyDebtData | null>(null);
    const visibleDebts = useMemo(() => props.debts.filter((debt) => {
        if (view === 'active') return debt.status !== 'settled';
        if (view === 'settled') return debt.status === 'settled';
        return debt.status !== 'settled' && debt.direction === view;
    }), [props.debts, view]);

    return (
        <div style={{ '--module-accent': 'var(--money-accent)' } as CSSProperties}>
            <Head title="Money Debts" />
            <header className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <div><h1 className="text-4xl font-bold tracking-[-0.05em] sm:text-6xl">Debts</h1><p className="mt-2 max-w-2xl text-secondary">Track money you owe and money owed to you without treating principal as income or spending.</p></div>
                <MoneySectionNav active="debts" />
            </header>

            {Object.keys(props.totalsByCurrency).length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {Object.entries(props.totalsByCurrency).map(([currency, totals]) => (
                        <Surface className="p-5" elevated key={currency}>
                            <p className="text-xs font-bold tracking-[0.16em] text-muted uppercase">{currency} position</p>
                            <div className="mt-4 grid grid-cols-2 gap-4"><div><p className="text-sm text-muted">You owe</p><p className="mt-1 text-xl font-bold tabular-nums">{formatMinorUnits(totals.payable, currency)}</p></div><div><p className="text-sm text-muted">Owed to you</p><p className="mt-1 text-xl font-bold text-success tabular-nums">{formatMinorUnits(totals.receivable, currency)}</p></div></div>
                        </Surface>
                    ))}
                </div>
            ) : (
                <Surface className="p-5 text-sm text-muted" elevated>No outstanding debts.</Surface>
            )}

            <div className="my-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div aria-label="Debt views" className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-border-subtle bg-surface p-1" role="group">
                    {views.map((item) => <button aria-pressed={view === item.value} className={`focus-ring shrink-0 rounded-full px-4 py-2 text-sm font-bold ${view === item.value ? 'bg-elevated text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`} key={item.value} onClick={() => setView(item.value)} type="button">{item.label}</button>)}
                </div>
                <Button onClick={() => setComposerOpen(true)}><Plus aria-hidden="true" size={17} />Debt</Button>
            </div>

            {visibleDebts.length > 0 ? <div className="grid gap-5 xl:grid-cols-2">{visibleDebts.map((debt) => <DebtCard debt={debt} key={debt.id} onRepay={() => setRepayingDebt(debt)} />)}</div> : (
                <Surface className="grid min-h-64 place-items-center p-8 text-center" elevated><div><HandCoins className="mx-auto text-muted" size={28} /><p className="mt-3 text-2xl font-bold">Nothing here</p><p className="mt-2 text-muted">This debt view is clear.</p></div></Surface>
            )}

            {composerOpen && <DebtComposerDrawer accounts={props.accounts} onClose={() => setComposerOpen(false)} people={props.people} today={props.today} />}
            {repayingDebt && <DebtRepaymentDrawer accounts={props.accounts} debt={repayingDebt} onClose={() => setRepayingDebt(null)} today={props.today} />}
        </div>
    );
}
