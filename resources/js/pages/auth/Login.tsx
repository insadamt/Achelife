import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

import { Button, Checkbox, Field } from '../../components/ui';

export default function Login() {
    const form = useForm({
        email: '',
        password: '',
        remember: false,
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.post('/login', {
            onFinish: () => form.reset('password'),
        });
    }

    return (
        <>
            <Head title="Log in" />
            <p className="text-xs font-bold tracking-[0.18em] text-accent uppercase">Return to your path</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em]">Welcome back</h1>
            <p className="mt-2 text-sm leading-6 text-secondary">Enter Achelife and pick up where you left off.</p>
            <form className="mt-7 space-y-5" onSubmit={submit}>
                <Field
                    autoComplete="email"
                    autoFocus
                    error={form.errors.email}
                    label="Email"
                    name="email"
                    onChange={(event) => form.setData('email', event.target.value)}
                    required
                    type="email"
                    value={form.data.email}
                />
                <Field
                    autoComplete="current-password"
                    error={form.errors.password}
                    label="Password"
                    name="password"
                    onChange={(event) => form.setData('password', event.target.value)}
                    required
                    type="password"
                    value={form.data.password}
                />
                <Checkbox
                    checked={form.data.remember}
                    label="Remember me"
                    name="remember"
                    onChange={(event) => form.setData('remember', event.target.checked)}
                />
                <Button disabled={form.processing} fullWidth type="submit">
                    {form.processing ? 'Entering…' : 'Enter Achelife'}
                </Button>
            </form>
            <p className="mt-7 text-center text-sm text-secondary">
                Need an account?{' '}
                <Link className="focus-ring rounded font-bold text-foreground underline decoration-border-strong underline-offset-4 hover:text-accent" href="/register">
                    Create account
                </Link>
            </p>
        </>
    );
}
