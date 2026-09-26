import { Head, usePage } from '@inertiajs/react';
import { Archive, Palette } from 'lucide-react';

import { PortabilitySettingsPanel } from '../../features/portability/PortabilitySettingsPanel';
import type { RestorePreview } from '../../features/portability/types';
import { AccountSettingsPanel } from '../../features/settings/AccountSettingsPanel';
import { AppearanceSettingsPanel } from '../../features/settings/AppearanceSettingsPanel';
import { CalendarSettingsPanel } from '../../features/settings/CalendarSettingsPanel';
import { isSettingsSection, SettingsNavigation } from '../../features/settings/SettingsNavigation';
import type { SharedPageProps } from '../../types';

interface TimezoneOption {
    value: string;
    label: string;
}

interface GeneralSettingsProps {
    restorePreview: RestorePreview | null;
    settings: {
        timezone: string;
        today: string;
        seasonRolloverPreference: 'automatic' | 'manual';
    };
    timezones: TimezoneOption[];
}

function selectedSection(url: string) {
    const section = new URLSearchParams(url.split('?')[1] ?? '').get('section');

    return isSettingsSection(section) ? section : 'appearance';
}

export default function General({ settings, timezones, restorePreview }: GeneralSettingsProps) {
    const page = usePage<SharedPageProps>();
    const section = selectedSection(page.url);
    const { auth } = page.props;
    const header = section === 'data'
        ? { title: 'Account data' }
        : { title: 'Settings' };
    const HeaderIcon = section === 'data' ? Archive : Palette;

    return (
        <div className="page-rail mx-auto w-full max-w-[80rem]">
            <Head title="General Settings" />

            <header className="page-chrome">
                <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-accent/10 text-accent-ink"><HeaderIcon aria-hidden="true" size={20} /></span><h1 className="text-4xl font-bold tracking-[-0.04em] sm:text-5xl">{header.title}</h1></div>
                <SettingsNavigation activeSection={section} />
            </header>

            <section aria-label="Selected settings" className="min-w-0">
                {section === 'appearance' && <AppearanceSettingsPanel />}
                {section === 'profile' && auth.user && <AccountSettingsPanel name={auth.user.name} />}
                {(section === 'calendar' || section === 'season') && <CalendarSettingsPanel settings={settings} timezones={timezones} />}
                {section === 'data' && <PortabilitySettingsPanel restorePreview={restorePreview} />}
            </section>
        </div>
    );
}
