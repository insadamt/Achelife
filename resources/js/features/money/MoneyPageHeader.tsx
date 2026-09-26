import type { ReactNode } from 'react';

import { PageChrome, PageHeader } from '../../components/ui';
import { MoneySectionNav } from './MoneySectionNav';

type MoneySection = 'overview' | 'history' | 'debts' | 'subscriptions' | 'organization' | 'statistics';

interface MoneyPageHeaderProps {
    active: MoneySection;
    title: string;
    action?: ReactNode;
}

export function MoneyPageHeader({ action, active, title }: MoneyPageHeaderProps) {
    return (
        <PageChrome>
            <PageHeader action={action} title={title} />
            <MoneySectionNav active={active} />
        </PageChrome>
    );
}
