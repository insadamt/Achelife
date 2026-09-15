export function formatTaskFocusDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours === 0) return minutes === 0 ? `${seconds}s` : `${minutes}m`;

    return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

export function formatTaskFocusDate(timestamp: string, timezone: string): string {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: timezone }).format(new Date(timestamp));
}

export function formatTaskFocusTime(timestamp: string, timezone: string): string {
    return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZone: timezone }).format(new Date(timestamp));
}
