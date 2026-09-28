import type { ResolvedTheme } from './theme';

export const defaultAccent = '#D7E66B';

const hexColorPattern = /^#[0-9a-fA-F]{6}$/;

function colorChannels(color: string): [number, number, number] {
    return [1, 3, 5].map((index) => Number.parseInt(color.slice(index, index + 2), 16)) as [number, number, number];
}

function hexColor(channels: number[]): string {
    return `#${channels.map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

function relativeLuminance(color: string): number {
    const [red, green, blue] = colorChannels(color).map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    }) as [number, number, number];

    return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

function contrastRatio(first: string, second: string): number {
    const brighter = Math.max(relativeLuminance(first), relativeLuminance(second));
    const darker = Math.min(relativeLuminance(first), relativeLuminance(second));
    return (brighter + 0.05) / (darker + 0.05);
}

function blendColor(source: string, destination: string, fraction: number): string {
    const sourceChannels = colorChannels(source);
    const destinationChannels = colorChannels(destination);
    return hexColor(sourceChannels.map((channel, index) => channel + ((destinationChannels[index] ?? channel) - channel) * fraction));
}

function readableAccentInk(accent: string, theme: ResolvedTheme): string {
    const surface = theme === 'light' ? '#F9FBFD' : '#18191C';
    const destination = theme === 'light' ? '#000000' : '#FFFFFF';

    for (let step = 0; step <= 100; step++) {
        const candidate = blendColor(accent, destination, step / 100);
        if (contrastRatio(candidate, surface) >= 4.5) return candidate;
    }

    return destination;
}

export function isHexColor(color: string): boolean {
    return hexColorPattern.test(color);
}

export function applyAccentPalette(theme: ResolvedTheme, accent: string): void {
    const root = document.documentElement;

    if (!isHexColor(accent) || accent.toUpperCase() === defaultAccent) {
        ['--accent', '--accent-ink', '--accent-foreground', '--text-link', '--focus-ring'].forEach((property) => root.style.removeProperty(property));
        return;
    }

    const ink = readableAccentInk(accent, theme);
    const foreground = contrastRatio(accent, '#0B0D06') >= contrastRatio(accent, '#FFFFFF') ? '#0B0D06' : '#FFFFFF';
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent-ink', ink);
    root.style.setProperty('--accent-foreground', foreground);
    root.style.setProperty('--text-link', ink);
    root.style.setProperty('--focus-ring', ink);
}
