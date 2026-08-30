import type { MoneySubscriptionRecurrence } from './types';

function parseDate(date: string) {
    const [year = 1970, month = 1, day = 1] = date.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
}

function isoDate(date: Date) {
    return date.toISOString().slice(0, 10);
}

function anchoredMonthDate(start: Date, monthOffset: number) {
    const target = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + monthOffset, 1));
    const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
    target.setUTCDate(Math.min(start.getUTCDate(), lastDay));
    return target;
}

export function occurrenceDate(startDate: string, recurrence: MoneySubscriptionRecurrence, position: number) {
    const start = parseDate(startDate);
    if (recurrence === 'weekly') start.setUTCDate(start.getUTCDate() + position * 7);
    else if (recurrence === 'monthly') return isoDate(anchoredMonthDate(start, position));
    else if (recurrence === 'every_three_months') return isoDate(anchoredMonthDate(start, position * 3));
    else return isoDate(anchoredMonthDate(start, position * 12));
    return isoDate(start);
}

export function schedulePreview(startDate: string, endDate: string, recurrence: MoneySubscriptionRecurrence) {
    if (!startDate || !endDate || startDate > endDate) return { count: 0, next: startDate || null };

    let count = 0;
    let next: string | null = null;
    while (count < 10000) {
        const date = occurrenceDate(startDate, recurrence, count);
        if (date > endDate) {
            next = date;
            break;
        }
        count++;
    }
    return { count, next };
}

export function readableSchedule(startDate: string, recurrence: MoneySubscriptionRecurrence) {
    if (!startDate) return 'Choose a start date';
    const date = parseDate(startDate);
    if (recurrence === 'weekly') return `Every week on ${new Intl.DateTimeFormat(undefined, { weekday: 'long', timeZone: 'UTC' }).format(date)}`;
    if (recurrence === 'monthly') return `Every month on day ${date.getUTCDate()}`;
    if (recurrence === 'every_three_months') return `Every three months on day ${date.getUTCDate()}`;
    return `Every year on ${new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', timeZone: 'UTC' }).format(date)}`;
}
