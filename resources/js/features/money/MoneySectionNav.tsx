import { Link } from '@inertiajs/react';
import { CalendarClock, LayoutDashboard, ReceiptText, Tags } from 'lucide-react';

import { classNames } from '../../components/ui/classNames';

type MoneySection = 'overview' | 'history' | 'subscriptions' | 'categories';

const sections: Array<{ href: string; icon: typeof LayoutDashboard; label: string; value: MoneySection }> = [
    { href: '/money', icon: LayoutDashboard, label: 'Overview', value: 'overview' },
    { href: '/money/history', icon: ReceiptText, label: 'History', value: 'history' },
    { href: '/money/subscriptions', icon: CalendarClock, label: 'Subscriptions', value: 'subscriptions' },
    { href: '/money/categories', icon: Tags, label: 'Categories', value: 'categories' },
];

export function MoneySectionNav({ active }: { active: MoneySection }) {
    return (
        <nav aria-label="Money sections" className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-border-subtle bg-surface p-1">
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
