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
        ? { eyebrow: 'Private and portable', title: 'Account data', description: 'Create a complete archive or safely replace this account from a validated one.' }
        : { eyebrow: 'Personalize Achelife', title: 'Settings', description: 'Tune the experience around your device, calendar, Seasons, and account data.' };
    const HeaderIcon = section === 'data' ? Archive : Palette;

    return (
        <div className="mx-auto max-w-6xl">
            <Head title="General Settings" />

            <header className="max-w-2xl">
                <p className="text-xs font-bold tracking-[0.18em] text-accent-ink uppercase">{header.eyebrow}</p>
                <div className="mt-2 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-accent/10 text-accent-ink"><HeaderIcon aria-hidden="true" size={20} /></span><h1 className="text-4xl font-bold tracking-[-0.04em] sm:text-5xl">{header.title}</h1></div>
                <p className="mt-3 text-base leading-7 text-secondary">{header.description}</p>
            </header>

            <div className="mt-8 grid gap-6 md:grid-cols-[15rem_minmax(0,1fr)] md:items-start">
                <aside className="md:sticky md:top-6"><SettingsNavigation activeSection={section} /></aside>
                <main aria-label="Selected settings" className="min-w-0">
                    {section === 'appearance' && <AppearanceSettingsPanel />}
                    {section === 'profile' && auth.user && <AccountSettingsPanel name={auth.user.name} />}
                    {(section === 'calendar' || section === 'season') && <CalendarSettingsPanel settings={settings} timezones={timezones} />}
                    {section === 'data' && <PortabilitySettingsPanel restorePreview={restorePreview} />}
                </main>
            </div>
        </div>
    );
}
