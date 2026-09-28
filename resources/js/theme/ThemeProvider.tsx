import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { usePage } from '@inertiajs/react';

import type { SharedPageProps } from '../types';
import { applyAccentPalette } from './accentPalette';
import { revealAppearanceFromCenter } from './appearanceReveal';
import { applyTheme, isThemePreference, readThemePreference, resolveTheme, storeThemePreference, themeStorageKey } from './theme';
import type { ResolvedTheme, ThemePreference } from './theme';

interface ThemeContextValue {
    preference: ThemePreference;
    resolvedTheme: ResolvedTheme;
    setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
    const { appearance } = usePage<SharedPageProps>().props;
    const [preference, setPreference] = useState<ThemePreference>(readThemePreference);
    const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(preference));

    useEffect(() => {
        function synchronizePreference(event: StorageEvent) {
            if (event.key === themeStorageKey) {
                setPreference(isThemePreference(event.newValue) ? event.newValue : 'system');
            }
        }

        window.addEventListener('storage', synchronizePreference);

        return () => window.removeEventListener('storage', synchronizePreference);
    }, []);

    useEffect(() => {
        const colorScheme = window.matchMedia('(prefers-color-scheme: dark)');

        function synchronizeTheme() {
            const nextTheme = resolveTheme(preference);
            setResolvedTheme(nextTheme);
            applyTheme(nextTheme);
        }

        synchronizeTheme();
        colorScheme.addEventListener('change', synchronizeTheme);

        return () => colorScheme.removeEventListener('change', synchronizeTheme);
    }, [preference]);

    useEffect(() => {
        applyAccentPalette(resolvedTheme, resolvedTheme === 'light' ? appearance.lightAccent : appearance.darkAccent);
    }, [appearance.darkAccent, appearance.lightAccent, resolvedTheme]);

    const contextValue = useMemo<ThemeContextValue>(
        () => ({
            preference,
            resolvedTheme,
            setPreference(nextPreference) {
                if (nextPreference === preference) return;

                const nextTheme = resolveTheme(nextPreference);
                const applyPreference = () => {
                    setPreference(nextPreference);
                    setResolvedTheme(nextTheme);
                    applyTheme(nextTheme);
                    applyAccentPalette(nextTheme, nextTheme === 'light' ? appearance.lightAccent : appearance.darkAccent);
                    storeThemePreference(nextPreference);
                };

                if (nextTheme === resolvedTheme) {
                    applyPreference();
                } else {
                    revealAppearanceFromCenter(applyPreference);
                }
            },
        }),
        [appearance.darkAccent, appearance.lightAccent, preference, resolvedTheme],
    );

    return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
    const context = useContext(ThemeContext);

    if (context === null) {
        throw new Error('useTheme must be used inside ThemeProvider.');
    }

    return context;
}
