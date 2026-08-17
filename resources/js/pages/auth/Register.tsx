import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

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
            <h1 className="text-xl font-semibold">Create an account</h1>
            <form className="mt-6 space-y-4" onSubmit={submit}>
                <label className="block">
                    <span className="text-sm font-medium">Name</span>
                    <input
                        autoComplete="name"
                        autoFocus
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                        onChange={(event) => form.setData('name', event.target.value)}
                        required
                        value={form.data.name}
                    />
                    {form.errors.name && <span className="mt-1 block text-sm text-red-600">{form.errors.name}</span>}
                </label>
                <label className="block">
                    <span className="text-sm font-medium">Email</span>
                    <input
                        autoComplete="email"
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
                        autoComplete="new-password"
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
                <label className="block">
                    <span className="text-sm font-medium">Confirm password</span>
                    <input
                        autoComplete="new-password"
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                        onChange={(event) => form.setData('password_confirmation', event.target.value)}
                        required
                        type="password"
                        value={form.data.password_confirmation}
                    />
                </label>
                <button
                    className="w-full rounded-md bg-slate-900 px-4 py-2 font-medium text-white disabled:opacity-60"
                    disabled={form.processing}
                    type="submit"
                >
                    Register
                </button>
            </form>
            <p className="mt-6 text-center text-sm text-slate-600">
                Already registered?{' '}
                <Link className="font-medium text-slate-900 underline" href="/login">
                    Log in
                </Link>
            </p>
        </>
    );
}
