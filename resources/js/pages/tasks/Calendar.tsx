import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';

import { PageChrome, PageHeader, PageRail } from '../../components/ui';
import { TaskCalendarControls } from '../../features/tasks/TaskCalendarControls';
import { TaskCalendarGrid } from '../../features/tasks/TaskCalendarGrid';
import { TaskDayAgendaDrawer } from '../../features/tasks/TaskDayAgendaDrawer';
import { TaskThreeDayGrid } from '../../features/tasks/TaskThreeDayGrid';
import { TaskWeekGrid } from '../../features/tasks/TaskWeekGrid';
import { TaskDetailsDrawer } from '../../features/tasks/TaskDetailsDrawer';
import { TaskSectionNav } from '../../features/tasks/TaskSectionNav';
import { calendarHref, dayLabel, tasksByDate } from '../../features/tasks/taskCalendar';
import type { CalendarProject, CalendarView } from '../../features/tasks/taskCalendar';
import type { TaskExplorerViewData, TaskViewData } from '../../features/tasks/types';

interface CalendarPageProps {
    today: string;
    view: CalendarView;
    month: string;
    weekStart: string;
    threeDayStart: string;
    selectedDate: string;
    tasks: TaskViewData[];
    projects: CalendarProject[];
    selectedProjectIds: number[];
    includeInbox: boolean;
    explorer: TaskExplorerViewData;
    intermission: boolean;
}

export default function TaskCalendarPage(props: CalendarPageProps) {
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const [dayAgendaOpen, setDayAgendaOpen] = useState(false);
    const [announcement, setAnnouncement] = useState('');
    const byDay = useMemo(() => tasksByDate(props.tasks), [props.tasks]);
    const focusedTasks = byDay.get(props.selectedDate) ?? [];
    const selectedTask = props.tasks.find((task) => task.id === selectedTaskId) ?? null;

    function navigate(date: string, projectIds = props.selectedProjectIds, includeInbox = props.includeInbox) {
        const anchor = props.view === 'week' ? props.weekStart : props.view === 'three_day' ? props.threeDayStart : props.month;
        router.get(calendarHref(props.view, anchor, date, projectIds, includeInbox), {}, { preserveScroll: true });
    }

    function openDayAgenda(date: string) {
        if (date === props.selectedDate) {
            setDayAgendaOpen(true);
            return;
        }

        const anchor = props.view === 'week' ? props.weekStart : props.view === 'three_day' ? props.threeDayStart : props.month;
        router.get(calendarHref(props.view, anchor, date, props.selectedProjectIds, props.includeInbox), {}, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => setDayAgendaOpen(true),
        });
    }

    function reschedule(task: TaskViewData, scheduledDate: string) {
        if (task.scheduledDate === scheduledDate) return;
        router.put(`/tasks/${task.id}/reschedule`, { scheduled_date: scheduledDate }, { preserveScroll: true, onSuccess: () => setAnnouncement(`${task.title} moved to ${dayLabel(scheduledDate)}.`) });
    }

    return <div style={{ '--module-accent': 'var(--task-accent)' } as CSSProperties}>
        <Head title="Calendar · Tasks" />
        <PageRail>
            <PageChrome>
                <PageHeader title="Calendar" />
                <TaskSectionNav active="calendar" />
            </PageChrome>
            {props.intermission && <p className="mt-5 rounded-2xl border border-warning/35 bg-warning/10 px-4 py-3 text-sm leading-6 text-warning">Intermission: you can keep planning and rescheduling Tasks. Completion and SP resume when your next Season starts.</p>}
            <TaskCalendarControls includeInbox={props.includeInbox} month={props.month} onFiltersChange={(projectIds, includeInbox) => navigate(props.selectedDate, projectIds, includeInbox)} projectIds={props.selectedProjectIds} projects={props.projects} threeDayStart={props.threeDayStart} today={props.today} view={props.view} weekStart={props.weekStart} />
            {props.view === 'week'
                ? <TaskWeekGrid onOpenTask={setSelectedTaskId} onReschedule={reschedule} onSelectDate={openDayAgenda} selectedDate={props.selectedDate} tasks={props.tasks} tasksByDay={byDay} today={props.today} weekStart={props.weekStart} />
                : props.view === 'three_day'
                    ? <TaskThreeDayGrid onOpenTask={setSelectedTaskId} onReschedule={reschedule} onSelectDate={openDayAgenda} selectedDate={props.selectedDate} tasks={props.tasks} tasksByDay={byDay} threeDayStart={props.threeDayStart} today={props.today} />
                : <TaskCalendarGrid month={props.month} onOpenTask={setSelectedTaskId} onReschedule={reschedule} onSelectDate={openDayAgenda} selectedDate={props.selectedDate} tasks={props.tasks} tasksByDay={byDay} today={props.today} />}
        </PageRail>
        {dayAgendaOpen && <TaskDayAgendaDrawer date={props.selectedDate} onClose={() => setDayAgendaOpen(false)} onOpenTask={setSelectedTaskId} tasks={focusedTasks} />}
        {selectedTask && <TaskDetailsDrawer explorer={props.explorer} key={selectedTask.id} onClose={() => setSelectedTaskId(null)} task={selectedTask} today={props.today} />}
        <p aria-live="polite" className="sr-only">{announcement}</p>
    </div>;
}
