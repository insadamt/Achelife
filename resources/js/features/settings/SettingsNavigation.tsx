import { Archive, CalendarDays, Palette, RefreshCw, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { ModuleNavigation } from '../../components/ui';

export type SettingsSection = 'appearance' | 'profile' | 'calendar' | 'season' | 'data';

interface SettingsNavigationItem {
    id: SettingsSection;
    label: string;
    icon: LucideIcon;
}

const navigationItems: SettingsNavigationItem[] = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'profile', label: 'Profile', icon: UserRound },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'season', label: 'Season', icon: RefreshCw },
    { id: 'data', label: 'Account data', icon: Archive },
];

export function isSettingsSection(value: string | null): value is SettingsSection {
    return navigationItems.some((item) => item.id === value);
}

export function SettingsNavigation({ activeSection }: { activeSection: SettingsSection }) {
    return (
        <ModuleNavigation
            active={activeSection}
            items={navigationItems.map(({ icon: Icon, id, label }) => ({ value: id, label, href: `/settings/general?section=${id}`, icon: <Icon aria-hidden="true" size={16} /> }))}
            label="Settings categories"
        />
    );
}
