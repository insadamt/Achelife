import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

import { Button, Field } from '../../components/ui';

export default function Register() {
    const form = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.post('/register', {
            onFinish: () => form.reset('password', 'password_confirmation'),
        });
    }

    return (
        <>
            <Head title="Register" />
            <p className="text-xs font-bold tracking-[0.18em] text-accent uppercase">Begin with intention</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em]">Create your account</h1>
            <p className="mt-2 text-sm leading-6 text-secondary">Set up your identity. Your journey begins after this step.</p>
            <form className="mt-7 space-y-5" onSubmit={submit}>
                <Field autoComplete="name" autoFocus error={form.errors.name} label="Name" name="name" onChange={(event) => form.setData('name', event.target.value)} required value={form.data.name} />
                <Field autoComplete="email" error={form.errors.email} label="Email" name="email" onChange={(event) => form.setData('email', event.target.value)} required type="email" value={form.data.email} />
                <Field autoComplete="new-password" error={form.errors.password} label="Password" name="password" onChange={(event) => form.setData('password', event.target.value)} required type="password" value={form.data.password} />
                <Field autoComplete="new-password" label="Confirm password" name="password_confirmation" onChange={(event) => form.setData('password_confirmation', event.target.value)} required type="password" value={form.data.password_confirmation} />
                <Button disabled={form.processing} fullWidth type="submit">
                    {form.processing ? 'Creating…' : 'Create account'}
                </Button>
            </form>
            <p className="mt-7 text-center text-sm text-secondary">
                Already registered?{' '}
                <Link className="focus-ring rounded font-bold text-foreground underline decoration-border-strong underline-offset-4 hover:text-accent" href="/login">
                    Enter Achelife
                </Link>
            </p>
        </>
    );
}
