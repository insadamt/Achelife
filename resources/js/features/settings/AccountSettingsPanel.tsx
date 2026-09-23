import { useForm } from '@inertiajs/react';
import { UserRound } from 'lucide-react';
import type { FormEvent } from 'react';

import { Button, Field } from '../../components/ui';

export function AccountSettingsPanel({ name }: { name: string }) {
    const profile = useForm({ name });

    function saveProfile(event: FormEvent) {
        event.preventDefault();
        profile.put('/settings/account/profile', { preserveScroll: true });
    }

    return (
        <section className="mt-6">
            <form className="rounded-[2rem] border border-border-subtle bg-surface p-5 shadow-[var(--shadow-panel)] sm:p-7" onSubmit={saveProfile}>
                <div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent-ink"><UserRound aria-hidden="true" size={21} /></span><div><p className="text-xs font-bold tracking-[0.14em] text-accent-ink uppercase">Your account</p><h2 className="mt-1 text-2xl font-bold tracking-[-0.03em]">Profile</h2><p className="mt-2 text-sm leading-6 text-muted">This name appears throughout your single-user Achelife instance.</p></div></div>
                <div className="mt-6 space-y-4">
                    <Field autoComplete="name" error={profile.errors.name} label="Name" onChange={(event) => profile.setData('name', event.target.value)} value={profile.data.name} />
                </div>
                <div className="mt-7 flex items-center justify-between gap-4 border-t border-border-subtle pt-5"><p aria-live="polite" className="text-sm text-muted">{profile.recentlySuccessful ? 'Profile saved.' : profile.isDirty ? 'You have unsaved changes.' : 'Your profile is up to date.'}</p><Button disabled={profile.processing || !profile.isDirty} type="submit">{profile.processing ? 'Saving…' : 'Save profile'}</Button></div>
            </form>
        </section>
    );
}
