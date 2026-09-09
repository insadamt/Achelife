export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = Exclude<ThemePreference, 'system'>;

export const themeStorageKey = 'achelife.theme';

export function isThemePreference(value: string | null): value is ThemePreference {
    return value === 'system' || value === 'light' || value === 'dark';
}

export function readThemePreference(): ThemePreference {
    try {
        const storedPreference = window.localStorage.getItem(themeStorageKey);

        return isThemePreference(storedPreference) ? storedPreference : 'system';
    } catch {
        return 'system';
    }
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
    if (preference !== 'system') {
        return preference;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: ResolvedTheme): void {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
}

export function storeThemePreference(preference: ThemePreference): void {
    try {
        if (preference === 'system') {
            window.localStorage.removeItem(themeStorageKey);
        } else {
            window.localStorage.setItem(themeStorageKey, preference);
        }
    } catch {
        // The active theme still works for this page when storage is unavailable.
    }
}
