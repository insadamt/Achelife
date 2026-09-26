import type { ReactNode } from 'react';

import { PageHeader } from '../../components/ui';
import { MoneySectionNav } from './MoneySectionNav';

type MoneySection = 'overview' | 'history' | 'debts' | 'subscriptions' | 'organization' | 'statistics';

interface MoneyPageHeaderProps {
    active: MoneySection;
    description: string;
    title: string;
    action?: ReactNode;
}

export function MoneyPageHeader({ action, active, description, title }: MoneyPageHeaderProps) {
    return (
        <div>
            <PageHeader action={action} description={description} eyebrow="Money" title={title} />
            <MoneySectionNav active={active} />
        </div>
    );
}
