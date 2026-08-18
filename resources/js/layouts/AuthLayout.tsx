import type { PropsWithChildren } from 'react';

import { BrandMark } from '../components/BrandMark';

export default function AuthLayout({ children }: PropsWithChildren) {
    return (
        <main className="relative grid min-h-screen place-items-center overflow-hidden bg-app px-4 py-10 text-foreground sm:px-6">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute top-[-18rem] left-1/2 h-[30rem] w-[42rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--accent)_8%,transparent)_0%,transparent_68%)]"
            />
            <div className="relative w-full max-w-md">
                <div className="mb-8 flex justify-center">
                    <BrandMark />
                </div>
                <section className="rounded-[2rem] border border-border-subtle bg-surface p-6 shadow-[0_28px_80px_rgba(0,0,0,0.4)] sm:p-8">
                    {children}
                </section>
                <p className="mt-6 text-center text-xs font-semibold tracking-[0.14em] text-muted uppercase">
                    Build your life with intention
                </p>
            </div>
        </main>
    );
}
