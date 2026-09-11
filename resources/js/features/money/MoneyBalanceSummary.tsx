import { Surface } from '../../components/ui';
import { formatMinorUnits } from './moneyPresentation';
import type { MoneyAccountData } from './types';

interface MoneyBalanceSummaryProps {
    accounts: MoneyAccountData[];
    totalsByCurrency: Record<string, number>;
}

export function MoneyBalanceSummary({ accounts, totalsByCurrency }: MoneyBalanceSummaryProps) {
    const totals = Object.entries(totalsByCurrency);

    return (
        <Surface className="money-balance-hero relative overflow-hidden p-5 sm:p-6" elevated>
            <p className="text-sm font-semibold text-secondary">Available balance</p>
            <p className="mt-1 text-xs text-muted">Across {accounts.length} {accounts.length === 1 ? 'Account' : 'Accounts'}</p>

            {totals.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-x-10 gap-y-5">
                    {totals.map(([currency, amount]) => (
                        <div key={currency}>
                            <p className="text-xs font-bold text-accent-ink">{currency}</p>
                            <p className="mt-1 text-4xl font-bold tracking-[-0.05em] tabular-nums sm:text-5xl">
                                {formatMinorUnits(amount, currency, false)}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="mt-7">
                    <p className="text-2xl font-bold tracking-[-0.04em]">No balances yet</p>
                    <p className="mt-2 text-sm text-secondary">Add your first Account.</p>
                </div>
            )}
        </Surface>
    );
}
