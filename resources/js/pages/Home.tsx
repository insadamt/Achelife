import { Head } from '@inertiajs/react';

export default function Home() {
    return (
        <>
            <Head title="Home" />
            <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Phase 0</p>
                <h1 className="mt-2 text-2xl font-semibold">Achelife is ready.</h1>
                <p className="mt-3 max-w-xl text-slate-600">
                    This minimal shell confirms that Laravel, Inertia, React, and authentication are connected.
                </p>
            </section>
        </>
    );
}
