import type { PropsWithChildren } from 'react';

import { ThemeProvider } from '../theme/ThemeProvider';

export default function IntroductionLayout({ children }: PropsWithChildren) {
    return (
        <ThemeProvider>
            <main className="relative grid min-h-screen overflow-hidden bg-app text-foreground" style={{ '--module-accent': 'var(--season-accent)' } as React.CSSProperties}>
                {children}
            </main>
        </ThemeProvider>
    );
}
