const shortDateFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const longDateFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
});

function localDate(date: string) {
    return new Date(`${date}T00:00:00`);
}

export function formatTaskDate(date: string) {
    return shortDateFormatter.format(localDate(date));
}

export function formatTaskDateLong(date: string) {
    return longDateFormatter.format(localDate(date));
}

export function formatCompletionDate(date: string) {
    return dateTimeFormatter.format(new Date(date));
}

export function projectedReward(important: boolean, scheduledDate: string, today: string) {
    const timing = scheduledDate > today ? 'early' : scheduledDate === today ? 'on_time' : 'late';
    const urgent = timing !== 'early';
    const baseReward = important ? (urgent ? 8 : 16) : urgent ? 4 : 2;

    return {
        points: timing === 'late' ? baseReward / 2 : baseReward,
        context: `${important ? 'Important' : 'Not important'} · ${timing === 'early' ? 'Not urgent' : timing === 'late' ? 'Late' : 'Urgent'}`,
        late: timing === 'late',
    };
}
