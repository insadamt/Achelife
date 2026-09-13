import { Head, Link } from '@inertiajs/react';
import { Store, Tags, Waypoints } from 'lucide-react';
import type { CSSProperties } from 'react';

import { classNames } from '../../../components/ui/classNames';
import { CategoryManager } from '../../../features/money/CategoryManager';
import { MerchantManager } from '../../../features/money/MerchantManager';
import { MoneyPageHeader } from '../../../features/money/MoneyPageHeader';
import { TagManager } from '../../../features/money/TagManager';
import type { MoneyPresetPackData } from '../../../features/money/MoneyPresetPackDrawer';
import type { MoneyCategoryData, MoneyMerchantData, MoneyTagManagementData } from '../../../features/money/types';

type OrganizationSection = 'categories' | 'merchants' | 'tags';

export default function MoneyOrganization({ categories, initialSection, merchants, presetPack, tags }: {
    categories: MoneyCategoryData[];
    initialSection: OrganizationSection;
    merchants: MoneyMerchantData[];
    presetPack: MoneyPresetPackData;
    tags: MoneyTagManagementData[];
}) {
    const sections = [
        { count: categories.filter((item) => item.archivedAt === null).length, icon: Waypoints, label: 'Categories', value: 'categories' as const },
        { count: merchants.filter((item) => item.archivedAt === null).length, icon: Store, label: 'Merchants', value: 'merchants' as const },
        { count: tags.filter((item) => item.archivedAt === null).length, icon: Tags, label: 'Tags', value: 'tags' as const },
    ];

    return (
        <div style={{ '--module-accent': 'var(--money-accent)' } as CSSProperties}>
            <Head title="Money Organization" />
            <MoneyPageHeader active="organization" description="Control the reusable labels that keep every transaction consistent and easy to find." title="Organization" />
            <nav aria-label="Organization sections" className="mb-7 grid gap-2 rounded-[1.5rem] border border-border-subtle bg-surface p-2 sm:grid-cols-3">
                {sections.map((section) => {
                    const SectionIcon = section.icon;
                    return (
                        <Link aria-current={initialSection === section.value ? 'page' : undefined} className={classNames('focus-ring flex min-h-16 items-center gap-3 rounded-2xl border px-4 transition-colors', initialSection === section.value ? 'border-[color-mix(in_srgb,var(--money-accent)_35%,transparent)] bg-elevated shadow-sm' : 'border-transparent text-muted hover:bg-surface-hover hover:text-foreground')} href={`/money/organization?section=${section.value}`} key={section.value}>
                            <span className={classNames('grid size-9 place-items-center rounded-xl', initialSection === section.value ? 'bg-[color-mix(in_srgb,var(--money-accent)_12%,transparent)] text-accent-ink' : 'bg-app')}><SectionIcon size={17} /></span>
                            <span className="font-bold">{section.label}</span><span className="ml-auto text-xs font-bold text-muted">{section.count}</span>
                        </Link>
                    );
                })}
            </nav>
            {initialSection === 'categories' && <CategoryManager categories={categories} presetPack={presetPack} />}
            {initialSection === 'merchants' && <MerchantManager merchants={merchants} />}
            {initialSection === 'tags' && <TagManager tags={tags} />}
        </div>
    );
}
