import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';

import { ProgressBar, Surface } from '../components/ui';
import { classNames } from '../components/ui/classNames';
import { TaskDetailsDrawer } from '../features/tasks/TaskDetailsDrawer';
import type { TaskViewData } from '../features/tasks/types';
import { TodayHabitSection } from '../features/today/TodayHabitSection';
import { TodayQuickActions } from '../features/today/TodayQuickActions';
import { TodaySettingsDialog } from '../features/today/TodaySettingsDialog';
import { TodayTaskRow } from '../features/today/TodayTaskRow';
import type { TodayPageProps } from '../features/today/types';

const todayStyle = { '--module-accent': 'var(--accent)' } as CSSProperties;

function calendarDateLabel(date: string) {
    return new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(new Date(`${date}T00:00:00Z`));
}

function shortDateLabel(date: string) {
    return new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' })
        .format(new Date(`${date}T00:00:00Z`));
}

function SectionHeading({ eyebrow, title, context }: { eyebrow: string; title: string; context?: string }) {
    return (
        <div className="mb-3 flex items-end justify-between gap-3">
            <div><p className="text-xs font-bold tracking-[0.18em] text-muted uppercase">{eyebrow}</p><h2 className="mt-1 text-2xl font-bold">{title}</h2></div>
            {context && <span className="text-xs font-semibold text-muted">{context}</span>}
        </div>
    );
}

function TaskList({ tasks, onOpen }: { tasks: TaskViewData[]; onOpen: (task: TaskViewData) => void }) {
    return <div className="rounded-3xl border border-border-subtle bg-surface px-4 sm:px-5">{tasks.map((task) => <TodayTaskRow key={task.id} onOpen={() => onOpen(task)} task={task} />)}</div>;
}

export default function Home(props: TodayPageProps) {
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const allTasks = useMemo(() => [...props.tasks.overdue, ...props.tasks.today, ...props.tasks.upcoming], [props.tasks]);
    const selectedTask = allTasks.find((task) => task.id === selectedTaskId) ?? null;
    const season = props.currentSeason;
    const objectives = season.objectives;

    function toggleObjective(objectiveId: number) {
        router.post(`/seasons/${season.id}/objectives/${objectiveId}/toggle`, {}, { preserveScroll: true });
    }

    return (
        <div style={todayStyle}>
            <Head title="Today" />

            <header className="mb-7 flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-bold tracking-[0.22em] text-accent uppercase">Today</p>
                    <h1 className="mt-2 text-4xl font-bold tracking-[-0.045em] sm:text-6xl">{calendarDateLabel(props.today)}</h1>
                    <p className="mt-2 text-sm text-secondary sm:text-base">Your daily mission, gathered in one place.</p>
                </div>
                <button aria-label="Open Today settings" className="focus-ring grid size-11 shrink-0 place-items-center rounded-full border border-border-strong bg-elevated text-xl transition-colors hover:bg-surface-hover" onClick={() => setSettingsOpen(true)} title="Today settings" type="button">⚙</button>
            </header>

            <Surface accent="var(--accent)" className="today-progress-hero mb-6 overflow-hidden p-5 sm:p-7" elevated tinted>
                <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                    <div>
                        <p className="text-xs font-bold tracking-[0.18em] text-accent uppercase">Daily progress</p>
                        {props.dailyProgress.total > 0 ? <div className="mt-2 flex items-end gap-4"><p className="text-5xl font-bold tracking-[-0.055em] sm:text-7xl">{props.dailyProgress.completed} / {props.dailyProgress.total}</p><p className="pb-1 text-2xl font-bold text-accent sm:text-3xl">{props.dailyProgress.percentage}%</p></div> : <p className="mt-3 text-3xl font-bold">No daily obligations</p>}
                    </div>
                    <div className="grid grid-cols-3 gap-5 border-t border-border-subtle pt-5 md:border-t-0 md:border-l md:pt-0 md:pl-7">
                        <div><p className="text-[0.625rem] font-bold tracking-wider text-muted uppercase">Season</p><p className="mt-1 text-xl font-bold">{String(season.number).padStart(2, '0')}</p></div>
                        <div><p className="text-[0.625rem] font-bold tracking-wider text-muted uppercase">Day</p><p className="mt-1 text-xl font-bold">{season.day} / 30</p></div>
                        <div><p className="text-[0.625rem] font-bold tracking-wider text-muted uppercase">Season SP</p><p className="mt-1 text-xl font-bold">{season.seasonPoints.toLocaleString()}</p></div>
                    </div>
                </div>
                {props.dailyProgress.total > 0 && <ProgressBar activeGlow className="mt-6" label="Daily obligations resolved" maximum={props.dailyProgress.total} showValue={false} value={props.dailyProgress.completed} />}
            </Surface>

            <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1.55fr)_minmax(20rem,0.75fr)]">
                <main className="space-y-8">
                    <section>
                        <SectionHeading context={`${props.tasks.overdueCount} ${props.tasks.overdueCount === 1 ? 'task' : 'tasks'}`} eyebrow="Attention" title="Overdue" />
                        {props.tasks.overdue.length > 0 ? <div className="rounded-3xl border border-warning/30 bg-warning/5 px-4 sm:px-5">{props.tasks.overdue.map((task) => <TodayTaskRow key={task.id} onOpen={() => setSelectedTaskId(task.id)} task={task} />)}{props.tasks.overdueCount > props.tasks.overdue.length && <Link className="block border-t border-border-subtle py-3 text-center text-sm font-bold text-warning" href="/tasks">View all {props.tasks.overdueCount} overdue Tasks</Link>}</div> : <p className="rounded-3xl border border-border-subtle bg-surface px-5 py-5 text-sm text-secondary">No overdue Tasks.</p>}
                    </section>

                    <section>
                        <SectionHeading context={`${props.tasks.today.length} scheduled`} eyebrow="Current mission" title="Today Tasks" />
                        {props.tasks.today.length > 0 ? <TaskList onOpen={(task) => setSelectedTaskId(task.id)} tasks={props.tasks.today} /> : <p className="rounded-3xl border border-border-subtle bg-surface px-5 py-7 text-sm text-secondary">No Tasks scheduled today.</p>}
                    </section>

                    {props.tasks.upcomingVisible && (
                        <section>
                            <SectionHeading context={`${props.tasks.upcoming.length} next`} eyebrow="Today is clear" title="Upcoming" />
                            {props.tasks.upcoming.length > 0 ? <div className="rounded-3xl border border-border-subtle bg-surface px-4 sm:px-5">{props.tasks.upcoming.map((task, index) => <div key={task.id}>{(index === 0 || props.tasks.upcoming[index - 1]!.scheduledDate !== task.scheduledDate) && <p className="border-b border-border-subtle pt-4 pb-2 text-[0.625rem] font-bold tracking-[0.14em] text-muted uppercase">{shortDateLabel(task.scheduledDate)}</p>}<TodayTaskRow onOpen={() => setSelectedTaskId(task.id)} task={task} /></div>)}</div> : <p className="rounded-3xl border border-border-subtle bg-surface px-5 py-7 text-sm text-secondary">Nothing upcoming. The runway is clear.</p>}
                        </section>
                    )}

                    <TodayHabitSection flexible={props.habits.flexible} required={props.habits.required} />

                    <section>
                        <SectionHeading eyebrow="Daily reflection" title="Diary" />
                        <Link className="focus-ring block rounded-3xl" href={props.diary.href}>
                            <Surface accent="var(--diary-accent)" className="flex items-center gap-4 p-5 transition-colors hover:border-[var(--diary-accent)]" interactive>
                                <span className={classNames('grid size-11 shrink-0 place-items-center rounded-full border-2 text-lg font-bold', props.diary.state === 'completed' ? 'border-success bg-success text-accent-foreground' : 'border-border-strong')}>{props.diary.state === 'completed' ? '✓' : '○'}</span>
                                <span className="min-w-0 flex-1"><span className="block text-lg font-bold">{props.diary.state === 'completed' ? "Today's entry completed" : "Write today's entry"}</span><span className="mt-1 block text-sm text-secondary">Streak {props.diary.streak}{props.diary.state === 'completed' ? ` · +${props.diary.earnedSp} SP earned` : ''}</span></span>
                                <span className="text-2xl text-muted" aria-hidden="true">→</span>
                            </Surface>
                        </Link>
                    </section>
                </main>

                <aside className="space-y-6 xl:sticky xl:top-8">
                    <section>
                        <SectionHeading context={`${season.objectiveCompletedCount} / ${season.objectiveCount}`} eyebrow="Season mission" title="Objectives" />
                        <Surface className="px-4 sm:px-5">
                            {objectives.length > 0 ? objectives.map((objective) => (
                                <div className={classNames('flex items-center gap-3 border-b border-border-subtle py-4 last:border-b-0', objective.completed && 'opacity-65')} key={objective.id}>
                                    <button aria-label={`${objective.completed ? 'Mark incomplete' : 'Complete'} ${objective.title}`} className={classNames('focus-ring grid size-9 shrink-0 place-items-center rounded-full border-2 font-bold', objective.completed ? 'border-success bg-success text-accent-foreground' : 'border-border-strong hover:border-[var(--season-accent)]')} disabled={!season.objectiveCompletionMutable} onClick={() => toggleObjective(objective.id)} type="button">{objective.completed ? '✓' : '○'}</button>
                                    <span className={classNames('min-w-0 flex-1 text-sm font-bold', objective.completed && 'line-through')}>{objective.title}</span>
                                    <span className="shrink-0 text-xs font-bold text-[var(--season-accent)]">+{objective.rewardSp} SP</span>
                                </div>
                            )) : <div className="py-6"><p className="text-sm text-secondary">No Objectives set for this Season.</p><Link className="mt-3 inline-block text-sm font-bold text-[var(--season-accent)] hover:underline" href="/seasons">View Season</Link></div>}
                        </Surface>
                    </section>

                    <section>
                        <SectionHeading eyebrow="Utilities" title="Quick actions" />
                        <TodayQuickActions laws={props.constitution.laws} money={props.money} season={season} today={props.today} />
                    </section>
                </aside>
            </div>

            {settingsOpen && <TodaySettingsDialog onClose={() => setSettingsOpen(false)} settings={props.settings} />}
            {selectedTask && <TaskDetailsDrawer onClose={() => setSelectedTaskId(null)} task={selectedTask} />}
        </div>
    );
}
