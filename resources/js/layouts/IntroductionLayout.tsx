import type { PropsWithChildren } from 'react';

export default function IntroductionLayout({ children }: PropsWithChildren) {
    return (
        <main className="relative grid min-h-screen overflow-hidden bg-app text-foreground" style={{ '--module-accent': 'var(--season-accent)' } as React.CSSProperties}>
            {children}
        </main>
    );
}
