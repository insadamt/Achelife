import { BarChart3, CalendarClock, HandCoins, LayoutDashboard, ReceiptText, Shapes } from 'lucide-react';

import { ModuleNavigation } from '../../components/ui';

type MoneySection = 'overview' | 'history' | 'debts' | 'subscriptions' | 'organization' | 'statistics';

const sections: Array<{ href: string; icon: typeof LayoutDashboard; label: string; value: MoneySection }> = [
    { href: '/money', icon: LayoutDashboard, label: 'Overview', value: 'overview' },
    { href: '/money/history', icon: ReceiptText, label: 'History', value: 'history' },
    { href: '/money/debts', icon: HandCoins, label: 'Debts', value: 'debts' },
    { href: '/money/subscriptions', icon: CalendarClock, label: 'Subscriptions', value: 'subscriptions' },
    { href: '/money/organization', icon: Shapes, label: 'Organization', value: 'organization' },
    { href: '/money/statistics', icon: BarChart3, label: 'Statistics', value: 'statistics' },
];

export function MoneySectionNav({ active }: { active: MoneySection }) {
    return <ModuleNavigation active={active} items={sections.map(({ icon: Icon, ...section }) => ({ ...section, icon: <Icon aria-hidden="true" size={16} /> }))} label="Money sections" />;
}
