import type { CSSProperties, HTMLAttributes, PropsWithChildren } from 'react';

import { classNames } from './classNames';

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
    active?: boolean;
    accent?: string;
    interactive?: boolean;
    elevated?: boolean;
    tinted?: boolean;
}

type AccentStyle = CSSProperties & { '--module-accent'?: string };

export function Surface({
    active = false,
    accent,
    interactive = false,
    elevated = false,
    tinted = false,
    className,
    children,
    style,
    ...props
}: PropsWithChildren<SurfaceProps>) {
    const accentStyle: AccentStyle = { ...style, ...(accent ? { '--module-accent': accent } : {}) };

    return (
        <div
            className={classNames(
                'rounded-[var(--radius-panel)] border bg-surface',
                elevated && 'bg-elevated shadow-[0_18px_50px_rgba(0,0,0,0.22)]',
                tinted && 'accent-surface',
                active && 'accent-border accent-glow',
                interactive &&
                    'transition-[transform,background-color,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-surface-hover',
                className,
            )}
            style={accentStyle}
            {...props}
        >
            {children}
        </div>
    );
}
