import { Link } from '@inertiajs/react';
import { Archive, CalendarDays, Palette, RefreshCw, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { classNames } from '../../components/ui/classNames';

export type SettingsSection = 'appearance' | 'profile' | 'calendar' | 'season' | 'data';

interface SettingsNavigationItem {
    id: SettingsSection;
    label: string;
    description: string;
    icon: LucideIcon;
}

const navigationItems: SettingsNavigationItem[] = [
    { id: 'appearance', label: 'Appearance', description: 'Theme for this device', icon: Palette },
    { id: 'profile', label: 'Profile', description: 'Your display name', icon: UserRound },
    { id: 'calendar', label: 'Calendar', description: 'Time zone and daily timing', icon: CalendarDays },
    { id: 'season', label: 'Season', description: 'What happens after Day 30', icon: RefreshCw },
    { id: 'data', label: 'Account data', description: 'Export and replacement', icon: Archive },
];

export function isSettingsSection(value: string | null): value is SettingsSection {
    return navigationItems.some((item) => item.id === value);
}

export function SettingsNavigation({ activeSection }: { activeSection: SettingsSection }) {
    return (
        <nav aria-label="Settings categories">
            <div className="flex gap-2 overflow-x-auto pb-2 md:block md:space-y-2 md:overflow-visible md:pb-0">
                {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const active = item.id === activeSection;

                    return (
                        <Link
                            aria-current={active ? 'page' : undefined}
                            className={classNames(
                                'focus-ring flex min-w-40 items-center gap-3 rounded-2xl border p-3 text-left transition-[background-color,border-color,color,box-shadow] duration-200 md:min-w-0 md:w-full',
                                active ? 'border-[color-mix(in_srgb,var(--module-accent)_52%,var(--border-subtle))] bg-[color-mix(in_srgb,var(--module-accent)_10%,var(--surface-primary))] text-foreground shadow-[0_8px_24px_color-mix(in_srgb,var(--module-accent)_8%,transparent)]' : 'border-border-subtle bg-surface text-secondary hover:border-border-strong hover:bg-surface-hover hover:text-foreground',
                            )}
                            href={`/settings/general?section=${item.id}`}
                            key={item.id}
                        >
                            <span className={classNames('grid size-9 shrink-0 place-items-center rounded-xl', active ? 'bg-accent/12 text-accent-ink' : 'bg-app text-muted')}><Icon aria-hidden="true" size={18} /></span>
                            <span className="min-w-0"><span className="block text-sm font-bold">{item.label}</span><span className="mt-0.5 block text-xs leading-5 text-muted md:text-sm">{item.description}</span></span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
