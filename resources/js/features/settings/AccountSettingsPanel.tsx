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
            <form className="rounded-[2rem] border border-border-subtle bg-surface p-5 sm:p-7" onSubmit={saveProfile}>
                <div className="flex items-center gap-3"><UserRound className="text-accent" size={21} /><h2 className="text-xl font-bold">Profile</h2></div>
                <p className="mt-2 text-sm leading-6 text-muted">This is the name shown inside your single-user Achelife instance.</p>
                <div className="mt-6 space-y-4">
                    <Field autoComplete="name" error={profile.errors.name} label="Name" onChange={(event) => profile.setData('name', event.target.value)} value={profile.data.name} />
                </div>
                <Button className="mt-6" disabled={profile.processing || !profile.isDirty} type="submit">Save profile</Button>
            </form>
        </section>
    );
}
