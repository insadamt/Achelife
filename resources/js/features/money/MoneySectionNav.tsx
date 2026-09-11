import { Link } from '@inertiajs/react';
import { BarChart3, CalendarClock, HandCoins, LayoutDashboard, ReceiptText, Tags } from 'lucide-react';

import { classNames } from '../../components/ui/classNames';

type MoneySection = 'overview' | 'history' | 'debts' | 'subscriptions' | 'categories' | 'statistics';

const sections: Array<{ href: string; icon: typeof LayoutDashboard; label: string; value: MoneySection }> = [
    { href: '/money', icon: LayoutDashboard, label: 'Overview', value: 'overview' },
    { href: '/money/history', icon: ReceiptText, label: 'History', value: 'history' },
    { href: '/money/debts', icon: HandCoins, label: 'Debts', value: 'debts' },
    { href: '/money/subscriptions', icon: CalendarClock, label: 'Subscriptions', value: 'subscriptions' },
    { href: '/money/categories', icon: Tags, label: 'Categories', value: 'categories' },
    { href: '/money/statistics', icon: BarChart3, label: 'Statistics', value: 'statistics' },
];

export function MoneySectionNav({ active }: { active: MoneySection }) {
    return (
        <nav aria-label="Money sections" className="-mx-4 flex max-w-[calc(100%+2rem)] gap-1 overflow-x-auto px-4 pt-2 sm:mx-0 sm:max-w-full sm:px-0">
            {sections.map((section) => {
                const SectionIcon = section.icon;

                return (
                    <Link
                        aria-current={active === section.value ? 'page' : undefined}
                        className={classNames(
                            'focus-ring icon-text relative flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-bold transition-colors sm:text-sm',
                            active === section.value ? 'bg-elevated text-foreground' : 'text-muted hover:bg-surface-hover hover:text-foreground',
                        )}
                        href={section.href}
                        key={section.value}
                    >
                        <SectionIcon aria-hidden="true" size={15} />
                        {section.label}
                        {active === section.value && <span aria-hidden="true" className="absolute right-3 bottom-0 left-3 h-0.5 rounded-full bg-[var(--money-accent)]" />}
                    </Link>
                );
            })}
        </nav>
    );
}
