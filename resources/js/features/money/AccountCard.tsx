import { Link } from '@inertiajs/react';

import { formatMinorUnits } from './moneyPresentation';
import type { MoneyAccountData } from './types';

const themes = [
    'from-[#173f46] via-[#246f6b] to-[#8ad8bd]',
    'from-[#242d57] via-[#455da4] to-[#9cb2f1]',
    'from-[#46233f] via-[#8d456b] to-[#e5a56f]',
    'from-[#392d17] via-[#80642d] to-[#d8bd70]',
    'from-[#20283a] via-[#435066] to-[#90a5b8]',
    'from-[#3e224b] via-[#704a98] to-[#bd8eda]',
];

export function AccountCard({ account, large = false }: { account: MoneyAccountData; large?: boolean }) {
    return (
        <Link
            className={`focus-ring group relative block aspect-[1.586/1] shrink-0 overflow-hidden rounded-[1.6rem] bg-gradient-to-br ${themes[account.themeIndex % themes.length]} p-5 text-white shadow-[0_22px_48px_rgba(0,0,0,0.3)] transition-transform duration-200 hover:-translate-y-1 ${large ? 'w-full max-w-[35rem] sm:p-7' : 'w-[min(82vw,22rem)] sm:w-full'}`}
            href={`/money/accounts/${account.id}`}
        >
            <span className="absolute -top-16 -right-10 size-48 rounded-full border border-white/12 bg-white/8" />
            <span className="absolute -right-8 -bottom-20 size-56 rounded-full border border-white/10" />
            <span className="relative flex h-full flex-col justify-between">
                <span className="flex items-start justify-between gap-4">
                    <span>
                        <span className="block text-[0.625rem] font-bold tracking-[0.18em] text-white/70 uppercase">Achelife wallet</span>
                        <span className="mt-1 block text-lg font-bold">{account.name}</span>
                    </span>
                    <span className="rounded-full border border-white/18 bg-black/10 px-3 py-1 text-xs font-bold tracking-widest">{account.currency}</span>
                </span>
                <span>
                    <span className={`block font-bold tracking-[-0.04em] ${large ? 'text-4xl sm:text-5xl' : 'text-3xl'}`}>{formatMinorUnits(account.balanceMinor, account.currency)}</span>
                    <span className="mt-3 flex items-center justify-between text-xs font-semibold tracking-[0.16em] text-white/65 uppercase">
                        <span>Account balance</span>
                        <span>•••• {account.visualIdentifier}</span>
                    </span>
                </span>
            </span>
        </Link>
    );
}
