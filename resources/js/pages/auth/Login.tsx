import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

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
            <h1 className="text-xl font-semibold">Log in</h1>
            <form className="mt-6 space-y-4" onSubmit={submit}>
                <label className="block">
                    <span className="text-sm font-medium">Email</span>
                    <input
                        autoComplete="email"
                        autoFocus
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                        onChange={(event) => form.setData('email', event.target.value)}
                        required
                        type="email"
                        value={form.data.email}
                    />
                    {form.errors.email && <span className="mt-1 block text-sm text-red-600">{form.errors.email}</span>}
                </label>
                <label className="block">
                    <span className="text-sm font-medium">Password</span>
                    <input
                        autoComplete="current-password"
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                        onChange={(event) => form.setData('password', event.target.value)}
                        required
                        type="password"
                        value={form.data.password}
                    />
                    {form.errors.password && (
                        <span className="mt-1 block text-sm text-red-600">{form.errors.password}</span>
                    )}
                </label>
                <label className="flex items-center gap-2 text-sm">
                    <input
                        checked={form.data.remember}
                        onChange={(event) => form.setData('remember', event.target.checked)}
                        type="checkbox"
                    />
                    Remember me
                </label>
                <button
                    className="w-full rounded-md bg-slate-900 px-4 py-2 font-medium text-white disabled:opacity-60"
                    disabled={form.processing}
                    type="submit"
                >
                    Log in
                </button>
            </form>
            <p className="mt-6 text-center text-sm text-slate-600">
                Need an account?{' '}
                <Link className="font-medium text-slate-900 underline" href="/register">
                    Register
                </Link>
            </p>
        </>
    );
}
