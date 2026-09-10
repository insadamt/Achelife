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
        <nav aria-label="Money sections" className="flex max-w-full flex-wrap gap-1 rounded-2xl border border-border-subtle bg-surface p-1">
            {sections.map((section) => {
                const SectionIcon = section.icon;

                return (
                    <Link
                        aria-current={active === section.value ? 'page' : undefined}
                        className={classNames(
                            'focus-ring icon-text flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-colors',
                            active === section.value ? 'bg-elevated text-foreground shadow-sm' : 'text-muted hover:text-foreground',
                        )}
                        href={section.href}
                        key={section.value}
                    >
                        <SectionIcon aria-hidden="true" size={15} />
                        {section.label}
                    </Link>
                );
            })}
        </nav>
    );
}
