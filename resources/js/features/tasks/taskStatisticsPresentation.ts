const durationNumber = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });

export function formatFocusDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;

    const minutes = seconds / 60;
    if (minutes < 60) return `${durationNumber.format(minutes)}m`;

    const hours = Math.floor(seconds / 3600);
    const remainingMinutes = Math.round((seconds % 3600) / 60);

    return remainingMinutes === 0 ? `${hours}h` : `${hours}h ${remainingMinutes}m`;
}

export function formatFocusDurationLong(seconds: number): string {
    if (seconds === 0) return '0 minutes';
    if (seconds < 60) return `${seconds} ${seconds === 1 ? 'second' : 'seconds'}`;

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    const parts = [];
    if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
    if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);

    return parts.join(' ');
}
