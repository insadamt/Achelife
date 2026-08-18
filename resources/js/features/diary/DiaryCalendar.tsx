import { router } from '@inertiajs/react';

import { Button, Dialog } from '../../components/ui';
import { formatDiaryDate, stateClassName } from './diaryPresentation';
import type { DiaryCalendarData } from './types';

interface DiaryCalendarProps {
    calendar: DiaryCalendarData;
    open: boolean;
    selectedDate: string;
    onClose: () => void;
}

function shiftMonth(month: string, offset: number) {
    const date = new Date(`${month}-01T12:00:00`);
    date.setMonth(date.getMonth() + offset);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function DiaryCalendar({ calendar, open, selectedDate, onClose }: DiaryCalendarProps) {
    function browse(month: string) {
        router.get('/diary', { date: selectedDate, month }, { preserveState: true, preserveScroll: true, only: ['calendar'] });
    }

    function selectDate(date: string) {
        onClose();
        router.get('/diary', { date, month: calendar.month }, { preserveState: false });
    }

    return (
        <Dialog description="Browse every calendar day from account creation through today." onClose={onClose} open={open} title="Diary calendar">
            <div className="flex items-center justify-between">
                <Button aria-label="Previous month" onClick={() => browse(shiftMonth(calendar.month, -1))} variant="ghost">←</Button>
                <div className="text-center"><p className="text-xs font-bold tracking-[0.18em] text-muted">{calendar.year}</p><p className="text-xl font-bold uppercase">{calendar.label}</p></div>
                <Button aria-label="Next month" onClick={() => browse(shiftMonth(calendar.month, 1))} variant="ghost">→</Button>
            </div>
            <div className="mt-5 grid grid-cols-7 gap-1 text-center text-[0.625rem] font-bold text-muted">
                {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1.5">
                {calendar.days.map((day) => (
                    <button
                        aria-label={`${formatDiaryDate(day.date, { dateStyle: 'long' })}, ${day.state}`}
                        className={`focus-ring aspect-square rounded-lg border text-sm font-semibold ${stateClassName(day.state)} ${!day.inMonth ? 'opacity-35' : ''} ${selectedDate === day.date ? 'ring-2 ring-[var(--diary-accent)] ring-offset-2 ring-offset-elevated' : ''}`}
                        disabled={day.state === 'unavailable'}
                        key={day.date}
                        onClick={() => selectDate(day.date)}
                        type="button"
                    >
                        {Number(day.date.slice(-2))}
                    </button>
                ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-3 text-xs text-secondary">
                {(['completed', 'pending', 'missed'] as const).map((state) => <span className="flex items-center gap-1.5" key={state}><span className={`size-3 rounded-sm border ${stateClassName(state)}`} />{state}</span>)}
            </div>
        </Dialog>
    );
}
