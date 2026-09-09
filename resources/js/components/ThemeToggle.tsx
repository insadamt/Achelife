import { Moon, Sun } from 'lucide-react';

import { useTheme } from '../theme/ThemeProvider';
import { classNames } from './ui/classNames';

export function ThemeToggle({ className }: { className?: string }) {
    const { resolvedTheme, setPreference } = useTheme();
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    const label = `Switch to ${nextTheme} mode`;

    return (
        <button
            aria-label={label}
            className={classNames(
                'focus-ring grid size-11 shrink-0 place-items-center rounded-2xl border border-border-subtle bg-elevated text-secondary transition-[background-color,border-color,color,transform] duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-hover hover:text-foreground',
                className,
            )}
            onClick={() => setPreference(nextTheme)}
            title={label}
            type="button"
        >
            {resolvedTheme === 'dark' ? <Sun aria-hidden="true" size={22} strokeWidth={2.1} /> : <Moon aria-hidden="true" size={22} strokeWidth={2.1} />}
        </button>
    );
}
