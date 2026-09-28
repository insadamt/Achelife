import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';

import { classNames } from '../../components/ui/classNames';
import { defaultAccent, isHexColor } from '../../theme/accentPalette';
import type { ResolvedTheme } from '../../theme/theme';
import type { SharedPageProps } from '../../types';

type AccentColors = Record<ResolvedTheme, string>;

const themes: ResolvedTheme[] = ['light', 'dark'];

export function AccentColorSettings() {
    const { appearance } = usePage<SharedPageProps>().props;
    const savedColors: AccentColors = { light: appearance.lightAccent, dark: appearance.darkAccent };
    const [draftColors, setDraftColors] = useState<Partial<AccentColors>>({});
    const [savingTheme, setSavingTheme] = useState<ResolvedTheme | null>(null);
    const [error, setError] = useState<string | null>(null);

    function saveAccent(theme: ResolvedTheme, color: string) {
        if (savingTheme !== null || !isHexColor(color)) return;

        setSavingTheme(theme);
        setError(null);
        router.put('/settings/appearance/accent', { theme, accent: color.toUpperCase() }, {
            preserveScroll: true,
            onSuccess: () => setDraftColors((current) => ({ ...current, [theme]: undefined })),
            onError: (errors) => setError(errors.accent ?? 'Could not save this color.'),
            onFinish: () => setSavingTheme(null),
        });
    }

    function updateDraft(theme: ResolvedTheme, color: string) {
        setDraftColors((current) => ({ ...current, [theme]: color }));
        setError(null);
    }

    return (
        <div className="mt-8 border-t border-border-subtle pt-6">
            <h3 className="text-lg font-bold">Main color</h3>
            <p className="mt-1 text-sm text-muted">Choose an accent for each mode. System uses the color for your device’s current mode. Your choices follow your account.</p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
                {themes.map((theme) => {
                    const color = draftColors[theme] ?? savedColors[theme];
                    const valid = isHexColor(color);
                    const changed = valid && color.toUpperCase() !== savedColors[theme].toUpperCase();
                    const otherTheme = theme === 'light' ? 'dark' : 'light';

                    return (
                        <div className="rounded-2xl border border-border-subtle bg-elevated p-4" key={theme}>
                            <div className="flex items-center gap-3">
                                <span aria-hidden="true" className="size-9 shrink-0 rounded-xl border border-border-strong" style={{ backgroundColor: valid ? color : savedColors[theme] }} />
                                <div>
                                    <h4 className="font-bold capitalize">{theme} mode</h4>
                                    <p className="text-xs text-muted">{savedColors[theme].toUpperCase() === defaultAccent ? 'Default lime' : `Saved ${savedColors[theme].toUpperCase()}`}</p>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center gap-3">
                                <input
                                    aria-label={`Choose ${theme} mode main color`}
                                    className="focus-ring h-11 w-16 shrink-0 cursor-pointer rounded-lg border border-border-strong bg-app p-1"
                                    onChange={(event) => updateDraft(theme, event.target.value.toUpperCase())}
                                    type="color"
                                    value={valid ? color : savedColors[theme]}
                                />
                                <input
                                    aria-label={`${theme} mode hex color`}
                                    className={classNames('focus-ring min-w-0 flex-1 rounded-xl border bg-app px-3 py-2 font-mono text-sm text-foreground', valid ? 'border-border-strong' : 'border-danger')}
                                    maxLength={7}
                                    onChange={(event) => updateDraft(theme, event.target.value)}
                                    spellCheck={false}
                                    type="text"
                                    value={color}
                                />
                            </div>
                            {!valid && <p className="mt-2 text-xs text-danger">Enter a color like #D7E66B.</p>}

                            <div className="mt-4 flex flex-wrap gap-2">
                                <button className="focus-ring rounded-xl bg-accent px-4 py-2 text-sm font-bold text-accent-foreground disabled:opacity-45" disabled={!changed || savingTheme !== null} onClick={() => saveAccent(theme, color)} type="button">Save color</button>
                                <button className="focus-ring rounded-xl border border-border-strong px-3 py-2 text-sm font-semibold disabled:opacity-45" disabled={savedColors[theme].toUpperCase() === defaultAccent || savingTheme !== null} onClick={() => saveAccent(theme, defaultAccent)} type="button">Reset to lime</button>
                                <button className="focus-ring rounded-xl border border-border-strong px-3 py-2 text-sm font-semibold disabled:opacity-45" disabled={savingTheme !== null} onClick={() => saveAccent(theme, savedColors[otherTheme])} type="button">Copy {otherTheme} color</button>
                            </div>
                        </div>
                    );
                })}
            </div>
            {error && <p className="mt-3 text-sm font-semibold text-danger" role="alert">{error}</p>}
        </div>
    );
}
