import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';

export default function AuthLayout({ children }: PropsWithChildren) {
    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 text-slate-950">
            <div className="w-full max-w-sm">
                <Link className="mb-8 block text-center text-xl font-semibold" href="/">
                    Achelife
                </Link>
                <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                    {children}
                </section>
            </div>
        </main>
    );
}
