import { Laptop, Moon, Sun } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { classNames } from '../../components/ui/classNames';
import { useTheme } from '../../theme/ThemeProvider';
import type { ThemePreference } from '../../theme/theme';

interface ThemeOption {
    value: ThemePreference;
    label: string;
    description: string;
    icon: LucideIcon;
}

const themeOptions: ThemeOption[] = [
    { value: 'system', label: 'System', description: 'Follow this device', icon: Laptop },
    { value: 'light', label: 'Light', description: 'Soft daylight', icon: Sun },
    { value: 'dark', label: 'Dark', description: 'Low-light comfort', icon: Moon },
];

export function AppearanceSettingsPanel() {
    const { preference, resolvedTheme, setPreference } = useTheme();

    return (
        <section className="mt-8 rounded-[2rem] border border-border-subtle bg-surface p-5 shadow-[var(--shadow-panel)] sm:p-7">
            <div className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent-ink">
                    {resolvedTheme === 'dark' ? <Moon aria-hidden="true" size={22} /> : <Sun aria-hidden="true" size={22} />}
                </span>
                <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-bold">Appearance</h2>
                    <p className="mt-1 text-sm leading-6 text-muted">Choose a theme for this device. System mode follows its display setting automatically.</p>
                </div>
            </div>

            <div aria-label="Color theme" className="mt-6 grid gap-3 sm:grid-cols-3" role="radiogroup">
                {themeOptions.map((option) => {
                    const OptionIcon = option.icon;
                    const selected = preference === option.value;

                    return (
                        <button
                            aria-checked={selected}
                            className={classNames(
                                'focus-ring flex min-h-24 items-center gap-3 rounded-2xl border p-4 text-left transition-[background-color,border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5',
                                selected
                                    ? 'border-[var(--module-accent)] bg-[color-mix(in_srgb,var(--module-accent)_9%,var(--surface-primary))] shadow-[0_0_0_1px_var(--module-accent)]'
                                    : 'border-border-subtle bg-elevated hover:border-border-strong hover:bg-surface-hover',
                            )}
                            key={option.value}
                            onClick={() => setPreference(option.value)}
                            role="radio"
                            type="button"
                        >
                            <OptionIcon aria-hidden="true" className={selected ? 'text-accent-ink' : 'text-secondary'} size={24} strokeWidth={2} />
                            <span>
                                <span className="block font-bold text-foreground">{option.label}</span>
                                <span className="mt-0.5 block text-sm text-muted">{option.description}</span>
                            </span>
                        </button>
                    );
                })}
            </div>

            <p aria-live="polite" className="mt-4 text-xs font-semibold tracking-[0.08em] text-muted uppercase">
                Using {resolvedTheme} mode on this device
            </p>
        </section>
    );
}
