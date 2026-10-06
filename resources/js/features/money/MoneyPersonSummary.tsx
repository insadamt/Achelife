import { Surface } from '../../components/ui';
import { formatMinorUnits } from './moneyPresentation';

export function MoneyPersonSummary({ totals }: { totals: Array<{ currency: string; incomeMinor: number; expenseMinor: number }> }) {
    return (
        <Surface className="mb-5 p-4 sm:p-5" elevated>
            <h2 className="font-bold">Person totals</h2>
            <p className="mt-1 text-sm text-muted">Income and expenses matching the current filters, across all pages.</p>
            {totals.length === 0 && <p className="mt-3 text-sm text-muted">No linked income or expenses match these filters.</p>}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {totals.map((total) => <dl className="rounded-2xl bg-app p-4" key={total.currency}>
                    <dt className="font-bold">{total.currency}</dt>
                    <dd className="mt-2 text-sm">Income: <strong className="tabular-nums">{formatMinorUnits(total.incomeMinor, total.currency)}</strong></dd>
                    <dd className="mt-1 text-sm">Expenses: <strong className="tabular-nums">{formatMinorUnits(total.expenseMinor, total.currency)}</strong></dd>
                </dl>)}
            </div>
        </Surface>
    );
}
