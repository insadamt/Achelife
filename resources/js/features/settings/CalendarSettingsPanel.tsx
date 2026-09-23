import { useForm } from '@inertiajs/react';
import { Clock3, LocateFixed, RefreshCw } from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo } from 'react';

import { Button, SelectField } from '../../components/ui';

interface TimezoneOption {
    value: string;
    label: string;
}

interface CalendarSettingsPanelProps {
    settings: {
        timezone: string;
        today: string;
        seasonRolloverPreference: 'automatic' | 'manual';
    };
    timezones: TimezoneOption[];
}

function detectedTimezone(): string | null {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
}

function localDateKey(timezone: string): string {
    const parts = new Intl.DateTimeFormat('en', {
        day: '2-digit',
        month: '2-digit',
        timeZone: timezone,
        year: 'numeric',
    }).formatToParts(new Date());
    const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));

    return `${value.year}-${value.month}-${value.day}`;
}

function localTimePreview(timezone: string): string {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'full',
        timeStyle: 'long',
        timeZone: timezone,
    }).format(new Date());
}

export function CalendarSettingsPanel({ settings, timezones }: CalendarSettingsPanelProps) {
    const browserTimezone = detectedTimezone();
    const form = useForm({
        timezone: settings.timezone,
        season_rollover_preference: settings.seasonRolloverPreference,
    });
    const preview = useMemo(() => localTimePreview(form.data.timezone), [form.data.timezone]);
    const changesCalendarDay = localDateKey(form.data.timezone) !== settings.today;
    const detectedTimezoneAvailable = browserTimezone !== null && timezones.some((timezone) => timezone.value === browserTimezone);

    function saveSettings(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.put('/settings/general', { preserveScroll: true });
    }

    return (
        <form className="rounded-[2rem] border border-border-subtle bg-surface p-5 shadow-[var(--shadow-panel)] sm:p-7" onSubmit={saveSettings}>
            <div className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-accent-ink"><Clock3 aria-hidden="true" size={21} /></span>
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold tracking-[0.14em] text-accent-ink uppercase">Calendar & season</p>
                    <h2 className="mt-1 text-2xl font-bold tracking-[-0.03em]">Set your rhythm</h2>
                    <p className="mt-2 text-sm leading-6 text-muted">Your time zone defines each Achelife day, and your rollover preference decides how the next Season begins.</p>
                </div>
            </div>

            <section className="mt-7">
                <div className="flex items-center gap-3"><Clock3 aria-hidden="true" className="text-accent-ink" size={18} /><h3 className="font-bold">Calendar day</h3></div>
                <div className="mt-4"><SelectField error={form.errors.timezone} label="Your time zone" onChange={(event) => form.setData('timezone', event.target.value)} options={timezones} value={form.data.timezone} /></div>
                {detectedTimezoneAvailable && browserTimezone !== form.data.timezone && <Button className="mt-4" onClick={() => form.setData('timezone', browserTimezone)} size="small" type="button" variant="secondary"><LocateFixed aria-hidden="true" size={16} />Use detected time zone</Button>}
                <div className="mt-6 rounded-2xl border border-border-subtle bg-app/55 p-4"><p className="text-xs font-bold tracking-[0.14em] text-muted uppercase">Local preview</p><p className="mt-2 text-base font-semibold text-foreground">{preview}</p></div>
                {changesCalendarDay && form.data.timezone !== settings.timezone && <p className="mt-4 rounded-2xl border border-warning/35 bg-warning/10 px-4 py-3 text-sm leading-6 text-warning">Saving moves Achelife to a different calendar day immediately. Existing Seasons and history will not be rewritten.</p>}
            </section>

            <section className="mt-7 border-t border-border-subtle pt-6">
                <div className="flex items-center gap-3"><RefreshCw aria-hidden="true" className="text-accent-ink" size={18} /><h3 className="font-bold">Season rollover</h3></div>
                <div className="mt-4"><SelectField error={form.errors.season_rollover_preference} label="After Day 30" onChange={(event) => form.setData('season_rollover_preference', event.target.value as 'automatic' | 'manual')} options={[{ value: 'automatic', label: 'Automatic — continue the next day' }, { value: 'manual', label: 'Manual — wait until I start' }]} value={form.data.season_rollover_preference} /></div>
                <p className="mt-3 text-sm leading-6 text-muted">Automatic rollover starts a new Season on your next calendar day. Manual rollover gives you an intermission until you begin again.</p>
            </section>

            <div className="mt-7 flex items-center justify-between gap-4 border-t border-border-subtle pt-5"><p aria-live="polite" className="text-sm text-muted">{form.isDirty ? 'You have unsaved changes.' : 'Changes are saved only when you choose Save.'}</p><Button disabled={form.processing || !form.isDirty} type="submit">{form.processing ? 'Saving…' : 'Save calendar & Season'}</Button></div>
        </form>
    );
}
