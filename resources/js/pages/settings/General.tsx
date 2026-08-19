import { Head, useForm } from '@inertiajs/react';
import { Clock3, LocateFixed } from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo } from 'react';

import { Button, SelectField } from '../../components/ui';

interface TimezoneOption {
    value: string;
    label: string;
}

interface GeneralSettingsProps {
    settings: {
        timezone: string;
        today: string;
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

export default function General({ settings, timezones }: GeneralSettingsProps) {
    const browserTimezone = detectedTimezone();
    const form = useForm({ timezone: settings.timezone });
    const preview = useMemo(() => localTimePreview(form.data.timezone), [form.data.timezone]);
    const changesCalendarDay = localDateKey(form.data.timezone) !== settings.today;
    const detectedTimezoneAvailable = browserTimezone !== null && timezones.some((timezone) => timezone.value === browserTimezone);

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.put('/settings/general', { preserveScroll: true });
    }

    return (
        <div className="mx-auto max-w-3xl">
            <Head title="General Settings" />

            <header>
                <p className="text-xs font-bold tracking-[0.18em] text-accent uppercase">Settings</p>
                <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">General</h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-secondary">
                    Choose when your Achelife calendar day begins and ends. Timestamps remain safely stored in UTC.
                </p>
            </header>

            <form className="mt-8 rounded-[2rem] border border-border-subtle bg-surface p-5 shadow-[0_20px_55px_rgba(0,0,0,0.2)] sm:p-7" onSubmit={submit}>
                <div className="flex items-start gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-accent">
                        <Clock3 aria-hidden="true" size={21} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-xl font-bold">Time zone</h2>
                        <p className="mt-1 text-sm leading-6 text-muted">Today, rewards, streaks, and Season boundaries use this calendar.</p>
                    </div>
                </div>

                <div className="mt-6">
                    <SelectField
                        error={form.errors.timezone}
                        label="Your time zone"
                        onChange={(event) => form.setData('timezone', event.target.value)}
                        options={timezones}
                        value={form.data.timezone}
                    />
                </div>

                {detectedTimezoneAvailable && browserTimezone !== form.data.timezone && (
                    <Button className="mt-4" onClick={() => form.setData('timezone', browserTimezone)} size="small" type="button" variant="secondary">
                        <LocateFixed aria-hidden="true" size={16} />
                        Use detected time zone
                    </Button>
                )}

                <div className="mt-6 rounded-2xl border border-border-subtle bg-app/55 p-4">
                    <p className="text-xs font-bold tracking-[0.14em] text-muted uppercase">Local preview</p>
                    <p className="mt-2 text-base font-semibold text-foreground">{preview}</p>
                </div>

                {changesCalendarDay && form.data.timezone !== settings.timezone && (
                    <p className="mt-4 rounded-2xl border border-warning/35 bg-warning/10 px-4 py-3 text-sm leading-6 text-warning">
                        Saving will move Achelife to a different calendar day immediately. Existing Seasons and history will not be rewritten.
                    </p>
                )}

                <div className="mt-6 flex justify-end">
                    <Button disabled={form.processing || !form.isDirty} type="submit">
                        {form.processing ? 'Saving…' : 'Save settings'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
