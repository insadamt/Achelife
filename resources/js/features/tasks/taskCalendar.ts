import type { TaskViewData } from './types';

export interface CalendarProject {
    id: number;
    name: string;
    color: string | null;
}

export function calendarHref(month: string, date: string, projectIds: number[], includeInbox: boolean): string {
    const parameters = new URLSearchParams({ month, date });
    projectIds.forEach((projectId) => parameters.append('projects[]', String(projectId)));
    if (includeInbox) parameters.append('projects[]', 'inbox');
    return `/tasks/calendar?${parameters.toString()}`;
}

export function monthDays(month: string): string[] {
    const [year, monthNumber] = month.split('-').map(Number);
    const lastDay = new Date(year, monthNumber, 0).getDate();
    return Array.from({ length: lastDay }, (_, index) => `${month}-${String(index + 1).padStart(2, '0')}`);
}

export function calendarGridDates(month: string): Array<string | null> {
    const [year, monthNumber] = month.split('-').map(Number);
    const firstWeekday = new Date(year, monthNumber - 1, 1).getDay();
    const leading = (firstWeekday + 6) % 7;
    const dates = monthDays(month);
    const trailing = (7 - ((leading + dates.length) % 7)) % 7;
    return [...Array<string | null>(leading).fill(null), ...dates, ...Array<string | null>(trailing).fill(null)];
}

export function shiftMonth(month: string, amount: number): string {
    const [year, monthNumber] = month.split('-').map(Number);
    const next = new Date(year, monthNumber - 1 + amount, 1);
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(month: string): string {
    return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(new Date(`${month}-01T12:00:00`));
}

export function dayLabel(date: string): string {
    return new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date(`${date}T12:00:00`));
}

export function tasksByDate(tasks: TaskViewData[]): Map<string, TaskViewData[]> {
    return tasks.reduce((grouped, task) => {
        grouped.set(task.scheduledDate, [...(grouped.get(task.scheduledDate) ?? []), task]);
        return grouped;
    }, new Map<string, TaskViewData[]>());
}
