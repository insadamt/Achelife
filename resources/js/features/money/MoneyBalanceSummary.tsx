import { WalletCards } from 'lucide-react';

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
        <Surface className="money-balance-hero overflow-hidden p-5 sm:p-7" elevated>
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-bold tracking-[0.18em] text-[var(--money-accent)] uppercase">Balances by currency</p>
                    <p className="mt-1 text-sm text-muted">{accounts.length} {accounts.length === 1 ? 'Account' : 'Accounts'}</p>
                </div>
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-[color-mix(in_srgb,var(--money-accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--money-accent)_10%,transparent)] text-[var(--money-accent)]">
                    <WalletCards aria-hidden="true" size={21} />
                </span>
            </div>

            {totals.length > 0 ? (
                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {totals.map(([currency, amount]) => (
                        <div className="rounded-2xl border border-white/8 bg-black/15 px-4 py-4" key={currency}>
                            <p className="text-xs font-bold tracking-[0.16em] text-muted uppercase">{currency}</p>
                            <p className="mt-1 text-3xl font-bold tracking-[-0.04em] tabular-nums sm:text-4xl">
                                {formatMinorUnits(amount, currency, false)}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="mt-7">
                    <p className="text-3xl font-bold tracking-[-0.04em]">No balances yet</p>
                    <p className="mt-2 text-sm text-secondary">Add your first Account.</p>
                </div>
            )}
        </Surface>
    );
}
