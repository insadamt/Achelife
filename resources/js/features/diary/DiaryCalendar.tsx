import { router } from '@inertiajs/react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

import { Button, Dialog } from '../../components/ui';
import { formatDiaryDate, stateClassName } from './diaryPresentation';
import type { DiaryCalendarData } from './types';

interface DiaryCalendarProps {
    calendar: DiaryCalendarData;
    accountCreatedOn: string;
    open: boolean;
    selectedDate: string;
    today: string;
    onClose: () => void;
    onSelectDate: (date: string) => void;
}

function shiftMonth(month: string, offset: number) {
    const date = new Date(`${month}-01T12:00:00`);
    date.setMonth(date.getMonth() + offset);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function DiaryCalendar({ calendar, accountCreatedOn, open, selectedDate, today, onClose, onSelectDate }: DiaryCalendarProps) {
    function browse(month: string) {
        router.get('/diary', { date: selectedDate, month }, { preserveState: true, preserveScroll: true, only: ['calendar'] });
    }

    function selectDate(date: string) {
        onClose();
        onSelectDate(date);
    }

    const earliestMonth = accountCreatedOn.slice(0, 7);
    const latestMonth = today.slice(0, 7);

    return (
        <Dialog description="Browse every calendar day from account creation through today." onClose={onClose} open={open} title="Diary calendar">
            <div className="flex items-center justify-between">
                <Button aria-label="Previous month" disabled={calendar.month <= earliestMonth} onClick={() => browse(shiftMonth(calendar.month, -1))} variant="ghost"><ChevronLeft aria-hidden="true" size={18} /></Button>
                <div className="text-center"><p className="text-xs font-bold tracking-[0.18em] text-muted">{calendar.year}</p><p className="text-xl font-bold uppercase">{calendar.label}</p></div>
                <Button aria-label="Next month" disabled={calendar.month >= latestMonth} onClick={() => browse(shiftMonth(calendar.month, 1))} variant="ghost"><ChevronRight aria-hidden="true" size={18} /></Button>
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
            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-secondary">
                <span className="flex items-center gap-1.5"><span className={`size-3 rounded-sm border ${stateClassName('completed')}`} />Complete</span>
                <span className="flex items-center gap-1.5"><span className={`size-3 rounded-sm border ${stateClassName('pending')}`} />Today</span>
                <span className="flex items-center gap-1.5"><span className={`size-3 rounded-sm border ${stateClassName('missed')}`} />Unwritten</span>
                {selectedDate !== today && <Button className="ml-auto" onClick={() => selectDate(today)} size="small" variant="ghost"><CalendarDays aria-hidden="true" size={16} />Today</Button>}
            </div>
        </Dialog>
    );
}
