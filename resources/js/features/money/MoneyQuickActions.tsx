import { ArrowDownLeft, ArrowRightLeft, ArrowUpRight } from 'lucide-react';

import { classNames } from '../../components/ui/classNames';
import type { MoneyTransactionType } from './types';

const actions: Array<{
    icon: typeof ArrowDownLeft;
    label: string;
    type: MoneyTransactionType;
}> = [
    { icon: ArrowDownLeft, label: 'Income', type: 'income' },
    { icon: ArrowUpRight, label: 'Expense', type: 'expense' },
    { icon: ArrowRightLeft, label: 'Transfer', type: 'transfer' },
];

export function MoneyQuickActions({ disabled = false, onSelect }: { disabled?: boolean; onSelect: (type: MoneyTransactionType) => void }) {
    return (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {actions.map((action) => {
                const ActionIcon = action.icon;

                return (
                    <button
                        className={classNames(
                            'focus-ring group flex min-h-16 items-center justify-center gap-2 rounded-2xl border border-border-strong bg-elevated px-2 py-3 text-center transition-[transform,background-color,border-color] hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--money-accent)_45%,var(--border-strong))] hover:bg-surface-hover disabled:pointer-events-none disabled:opacity-45 sm:min-h-18 sm:px-4',
                            action.type === 'income' && 'hover:border-success/45',
                            action.type === 'expense' && 'hover:border-danger/45',
                        )}
                        disabled={disabled}
                        key={action.type}
                        onClick={() => onSelect(action.type)}
                        type="button"
                    >
                        <ActionIcon
                            aria-hidden="true"
                            className={classNames(
                                'text-[var(--money-accent)]',
                                action.type === 'income' && 'text-success',
                                action.type === 'expense' && 'text-danger',
                            )}
                            size={20}
                        />
                        <span className="text-[0.7rem] font-bold text-foreground sm:text-sm">{action.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
