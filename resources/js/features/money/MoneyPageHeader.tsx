import type { ReactNode } from 'react';

import { MoneySectionNav } from './MoneySectionNav';

type MoneySection = 'overview' | 'history' | 'debts' | 'subscriptions' | 'categories' | 'statistics';

interface MoneyPageHeaderProps {
    active: MoneySection;
    description: string;
    title: string;
    action?: ReactNode;
}

export function MoneyPageHeader({ action, active, description, title }: MoneyPageHeaderProps) {
    return (
        <header className="mb-6">
            <div className="flex flex-col gap-4 border-b border-border-subtle pb-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                    <p className="text-xs font-bold tracking-[0.16em] text-accent-ink uppercase">Money</p>
                    <h1 className="mt-1.5 text-3xl font-bold tracking-[-0.045em] sm:text-4xl">{title}</h1>
                    <p className="mt-1.5 max-w-2xl text-sm leading-5 text-secondary">{description}</p>
                </div>
                {action && <div className="shrink-0">{action}</div>}
            </div>
            <MoneySectionNav active={active} />
        </header>
    );
}
