import { Link } from '@inertiajs/react';
import { useState } from 'react';

import { Button, Dialog, Surface } from '../../components/ui';
import { RecordViolationDialog } from '../constitution/RecordViolationDialog';
import type { ConstitutionSeasonData, LawViewData } from '../constitution/types';
import { TransactionDrawer } from '../money/TransactionDrawer';
import { formatMinorUnits } from '../money/moneyPresentation';
import type { MoneyAccountData, MoneyCategoryData, MoneyTransactionType } from '../money/types';

function ConstitutionQuickAction({ laws, season, today }: { laws: LawViewData[]; season: ConstitutionSeasonData; today: string }) {
    const [choosingLaw, setChoosingLaw] = useState(false);
    const [selectedLaw, setSelectedLaw] = useState<LawViewData | null>(null);

    return (
        <Surface className="p-5">
            <p className="text-xs font-bold tracking-[0.16em] text-[var(--constitution-accent)] uppercase">Constitution</p>
            {laws.length > 0 ? <><p className="mt-2 text-sm text-secondary">{laws.length} active {laws.length === 1 ? 'Law' : 'Laws'}</p><Button className="mt-5" fullWidth onClick={() => setChoosingLaw(true)} variant="secondary">Record violation</Button></> : <><p className="mt-2 text-sm text-secondary">No active Laws</p><Link className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-border-strong bg-elevated px-4 text-sm font-bold uppercase" href="/constitution">Open Constitution</Link></>}

            {choosingLaw && (
                <Dialog description="Only active Laws are available." onClose={() => setChoosingLaw(false)} open title="Choose a Law">
                    <div className="space-y-2">
                        {laws.map((law) => <button className="focus-ring flex min-h-14 w-full items-center justify-between rounded-2xl border border-border-strong bg-app px-4 text-left hover:border-[var(--constitution-accent)]" key={law.id} onClick={() => { setChoosingLaw(false); setSelectedLaw(law); }} type="button"><span className="font-bold">{law.name}</span><span className="text-xs text-muted">Next ×{law.nextMultiplier}</span></button>)}
                    </div>
                </Dialog>
            )}
            {selectedLaw && <RecordViolationDialog law={selectedLaw} onClose={() => setSelectedLaw(null)} season={season} today={today} />}
        </Surface>
    );
}

function MoneyQuickAction({ accounts, categories, totalsByCurrency, canTransfer, today }: {
    accounts: MoneyAccountData[];
    categories: MoneyCategoryData[];
    totalsByCurrency: Record<string, number>;
    canTransfer: boolean;
    today: string;
}) {
    const [transactionType, setTransactionType] = useState<MoneyTransactionType | null>(null);
    const totals = Object.entries(totalsByCurrency);

    return (
        <Surface className="p-5">
            <p className="text-xs font-bold tracking-[0.16em] text-[var(--money-accent)] uppercase">Money</p>
            {accounts.length > 0 ? <><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">{totals.map(([currency, amount]) => <span className="text-sm font-bold" key={currency}>{formatMinorUnits(amount, currency)}</span>)}</div><div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3"><Button onClick={() => setTransactionType('income')} size="small" variant="secondary">+ Income</Button><Button onClick={() => setTransactionType('expense')} size="small" variant="secondary">− Expense</Button><Button className="col-span-2 sm:col-span-1 xl:col-span-2 2xl:col-span-1" disabled={!canTransfer} onClick={() => setTransactionType('transfer')} size="small" title={canTransfer ? undefined : 'Add two Accounts with the same currency to transfer'} variant="secondary">Transfer</Button></div></> : <><p className="mt-2 text-sm text-secondary">No active Accounts</p><Link className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-border-strong bg-elevated px-4 text-sm font-bold uppercase" href="/money">Open Money</Link></>}
            {transactionType && <TransactionDrawer accounts={accounts} categories={categories} initialType={transactionType} onClose={() => setTransactionType(null)} today={today} />}
        </Surface>
    );
}

export function TodayQuickActions({ laws, season, today, money }: {
    laws: LawViewData[];
    season: ConstitutionSeasonData;
    today: string;
    money: { accounts: MoneyAccountData[]; categories: MoneyCategoryData[]; totalsByCurrency: Record<string, number>; canTransfer: boolean };
}) {
    return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1"><ConstitutionQuickAction laws={laws} season={season} today={today} /><MoneyQuickAction {...money} today={today} /></div>;
}
