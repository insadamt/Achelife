import { Link } from '@inertiajs/react';
import { ArrowUpRight, ChevronRight, Wallet } from 'lucide-react';

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
            className={`focus-ring group relative block aspect-[1.72/1] w-full shrink-0 overflow-hidden rounded-[1.5rem] bg-gradient-to-br ${themes[account.themeIndex % themes.length]} p-5 text-white shadow-[0_16px_36px_rgba(0,0,0,0.26)] transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_22px_46px_rgba(0,0,0,0.32)] ${large ? 'max-w-[32rem] sm:p-7' : ''}`}
            href={`/money/accounts/${account.id}`}
        >
            <span className="absolute -top-16 -right-10 size-48 rounded-full border border-white/12 bg-white/8" />
            <span className="absolute -right-8 -bottom-20 size-56 rounded-full border border-white/10" />
            <span className="relative flex h-full flex-col justify-between">
                <span className="flex items-start justify-between gap-4">
                    <span>
                        <span className="flex items-center gap-2 text-white/70"><Wallet aria-hidden="true" size={15} /><span className="text-[0.625rem] font-bold tracking-[0.18em] uppercase">Account</span></span>
                        <span className="mt-1 block text-lg font-bold">{account.name}</span>
                    </span>
                    <span className="flex items-center gap-2">
                        <span className="rounded-full border border-white/18 bg-black/10 px-3 py-1 text-xs font-bold tracking-widest">{account.currency}</span>
                        <ArrowUpRight aria-hidden="true" className="opacity-55 transition-opacity group-hover:opacity-100" size={17} />
                    </span>
                </span>
                <span>
                    <span className={`block font-bold tracking-[-0.04em] tabular-nums ${large ? 'text-4xl sm:text-5xl' : 'text-3xl'}`}>{formatMinorUnits(account.balanceMinor, account.currency)}</span>
                    <span className="mt-3 flex items-center justify-end text-xs font-semibold tracking-[0.16em] text-white/65 uppercase">
                        <span>•••• {account.visualIdentifier}</span>
                    </span>
                </span>
            </span>
        </Link>
    );
}

export function AccountListItem({ account }: { account: MoneyAccountData }) {
    return (
        <Link className="focus-ring group flex min-h-17 items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-surface-hover" href={`/money/accounts/${account.id}`}>
            <span className={`grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${themes[account.themeIndex % themes.length]} text-white shadow-sm`}>
                <Wallet aria-hidden="true" size={18} />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate font-bold">{account.name}</span>
                <span className="mt-0.5 block text-xs text-muted">•••• {account.visualIdentifier} · {account.currency}</span>
            </span>
            <strong className="shrink-0 text-right font-bold tabular-nums">{formatMinorUnits(account.balanceMinor, account.currency)}</strong>
            <ChevronRight aria-hidden="true" className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5" size={17} />
        </Link>
    );
}
