import { router, usePage } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';

import type { SharedPageProps } from '../types';

export default function AppLayout({ children }: PropsWithChildren) {
    const { auth, name } = usePage<SharedPageProps>().props;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-950">
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
                    <span className="font-semibold">{name}</span>
                    <div className="flex items-center gap-4 text-sm">
                        <span className="text-slate-600">{auth.user?.name}</span>
                        <button
                            className="font-medium text-slate-900 hover:text-slate-600"
                            onClick={() => router.post('/logout')}
                            type="button"
                        >
                            Log out
                        </button>
                    </div>
                </div>
            </header>
            <main className="mx-auto max-w-5xl px-6 py-12">{children}</main>
        </div>
    );
}
