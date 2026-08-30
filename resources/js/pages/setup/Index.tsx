import { Head, useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import type { FormEvent } from 'react';

import { Button, Field } from '../../components/ui';

export default function Setup() {
    const form = useForm({ name: '', timezone: 'UTC' });
    const setFormData = form.setData;

    useEffect(() => {
        const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        if (detectedTimezone) {
            setFormData('timezone', detectedTimezone);
        }
    }, [setFormData]);

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.post('/setup');
    }

    return (
        <>
            <Head title="Set up Achelife" />
            <p className="text-xs font-bold tracking-[0.18em] text-accent uppercase">Your private space</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em]">Set up Achelife</h1>
            <p className="mt-2 text-sm leading-6 text-secondary">
                Achelife is a single-user, self-hosted application. Choose the name shown inside your private instance—no login is required.
            </p>
            <form className="mt-7 space-y-5" onSubmit={submit}>
                <input name="timezone" type="hidden" value={form.data.timezone} />
                <Field autoComplete="name" autoFocus error={form.errors.name} label="Your name" name="name" onChange={(event) => form.setData('name', event.target.value)} required value={form.data.name} />
                <Button disabled={form.processing} fullWidth type="submit">
                    {form.processing ? 'Preparing…' : 'Continue'}
                </Button>
            </form>
            <p className="mt-6 rounded-2xl border border-warning/35 bg-warning/10 px-4 py-3 text-sm leading-6 text-warning">
                Keep this instance on localhost, a trusted private network, or behind a private VPN. Anyone who can reach it can use it.
            </p>
        </>
    );
}
