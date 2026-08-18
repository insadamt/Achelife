const shortDateFormatter = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
});

const fullDateFormatter = new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
});

function asLocalDate(date: string) {
    return new Date(`${date}T00:00:00`);
}

export function formatShortDate(date: string) {
    return shortDateFormatter.format(asLocalDate(date));
}

export function formatFullDate(date: string) {
    return fullDateFormatter.format(asLocalDate(date));
}

export function formatSeasonRange(startDate: string, endDate: string) {
    return `${formatShortDate(startDate)} — ${formatShortDate(endDate)}`;
}
