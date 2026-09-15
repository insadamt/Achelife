import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ChevronRight, Undo2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

import { Button } from '../../components/ui';
import { TaskComposer } from '../../features/tasks/TaskComposer';
import { TaskDetailsDrawer } from '../../features/tasks/TaskDetailsDrawer';
import { TaskFileBrowser } from '../../features/tasks/TaskFileBrowser';
import { TaskList } from '../../features/tasks/TaskList';
import { TaskPagination } from '../../features/tasks/TaskPagination';
import { TaskSectionNav } from '../../features/tasks/TaskSectionNav';
import { TaskViewNavigation } from '../../features/tasks/TaskViewNavigation';
import { TaskWorkspace } from '../../features/tasks/TaskWorkspace';
import { taskNavigationHref } from '../../features/tasks/taskNavigation';
import type { PaginatedTasks, ProjectTaskView, TaskExplorerViewData, TaskSearchFilters, TaskViewData, TaskWorkspaceViewData } from '../../features/tasks/types';

interface TasksPageProps {
    today: string;
    todayTasks: TaskViewData[];
    upcomingTasks: TaskViewData[];
    overdueTasks: PaginatedTasks;
    completedTasks: PaginatedTasks;
    intermission: boolean;
    explorer: TaskExplorerViewData;
    searchFilters: TaskSearchFilters;
    searchResults: PaginatedTasks | null;
    workspace: TaskWorkspaceViewData;
}

export default function TasksIndex(props: TasksPageProps) {
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const [completedRows, setCompletedRows] = useState(props.completedTasks.data);
    const [loadingMoreCompleted, setLoadingMoreCompleted] = useState(false);
    const [recentlyCompletedTask, setRecentlyCompletedTask] = useState<TaskViewData | null>(null);
    const [announcement, setAnnouncement] = useState('');

    useEffect(() => {
        if (!recentlyCompletedTask) return;
        const timeout = window.setTimeout(() => setRecentlyCompletedTask(null), 6000);
        return () => window.clearTimeout(timeout);
    }, [recentlyCompletedTask]);

    const visibleCompletedRows = props.completedTasks.current_page === 1 ? props.completedTasks.data : completedRows;
    const tasks = selectedTasks(props, visibleCompletedRows);
    const selectedTask = allVisibleTasks(props, visibleCompletedRows).find((task) => task.id === selectedTaskId) ?? null;
    const nextCompletedPage = props.completedTasks.links.at(-1)?.url ?? null;
    const showingSearchResults = props.searchResults !== null;
    const browsingManager = !showingSearchResults && (props.workspace.view === 'files' || props.workspace.view === 'folder');
    const taskLocation = props.workspace.view === 'project' || props.workspace.view === 'inbox';

    function loadMoreCompleted() {
        if (!nextCompletedPage || loadingMoreCompleted) return;
        router.get(nextCompletedPage, {}, {
            only: ['completedTasks'],
            preserveScroll: true,
            preserveState: true,
            preserveUrl: true,
            onStart: () => setLoadingMoreCompleted(true),
            onSuccess: (page) => {
                const nextTasks = page.props.completedTasks as PaginatedTasks;
                setCompletedRows((currentRows) => {
                    const baseRows = props.completedTasks.current_page === 1 ? props.completedTasks.data : currentRows;
                    const loadedIds = new Set(baseRows.map((task) => task.id));
                    return [...baseRows, ...nextTasks.data.filter((task) => !loadedIds.has(task.id))];
                });
            },
            onFinish: () => setLoadingMoreCompleted(false),
        });
    }

    function undoCompletion() {
        if (!recentlyCompletedTask) return;
        router.delete(`/tasks/${recentlyCompletedTask.id}/completion`, {
            preserveScroll: true,
            onSuccess: () => setRecentlyCompletedTask(null),
        });
    }

    return (
        <div style={{ '--module-accent': 'var(--task-accent)' } as CSSProperties}>
            <Head title={`${props.workspace.label} · Tasks`} />
            <div className="mx-auto max-w-7xl">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-bold text-accent-ink">Task workspace</p>
                        <h1 className="text-4xl font-bold tracking-[-0.05em] sm:text-5xl">Tasks</h1>
                    </div>
                    <TaskSectionNav active="tasks" />
                </div>
                {props.intermission && (
                    <p className="mb-5 rounded-2xl border border-warning/35 bg-warning/10 px-4 py-3 text-sm leading-6 text-warning">
                        Intermission: keep planning and rescheduling Tasks. Completion and SP resume when your next Season starts.
                    </p>
                )}

                <TaskWorkspace>
                    {browsingManager ? (
                        <TaskFileBrowser explorer={props.explorer} filters={props.searchFilters} onAnnounce={setAnnouncement} workspace={props.workspace} />
                    ) : (
                        <>
                            {taskLocation && <TaskLocationBreadcrumb explorer={props.explorer} workspace={props.workspace} />}
                            <TaskComposer
                                explorer={props.explorer}
                                initialProjectId={props.workspace.view === 'project' ? props.workspace.projectId : null}
                                showProjectControl={!taskLocation}
                                today={props.today}
                            />
                            <TaskViewNavigation
                                counts={{
                                    completed: props.completedTasks.total,
                                    overdue: props.overdueTasks.total,
                                    today: props.todayTasks.length,
                                    upcoming: props.upcomingTasks.length,
                                }}
                                workspace={props.workspace}
                            />
                            <section aria-label={`${showingSearchResults ? 'Search results' : props.workspace.taskView} Tasks`} className="mt-5">
                                {showingSearchResults && (
                                    <div className="mb-4">
                                        <h2 className="text-xl font-bold">Search results</h2>
                                        <p className="mt-1 text-sm text-muted">{tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'}</p>
                                    </div>
                                )}
                                <TaskList
                                    emptyMessage={showingSearchResults ? 'No Tasks match this search.' : emptyMessage(props.workspace.taskView, props.workspace.view)}
                                    onAnnounce={setAnnouncement}
                                    onCompleted={setRecentlyCompletedTask}
                                    onOpen={setSelectedTaskId}
                                    projectId={props.workspace.projectId}
                                    reorderable={false}
                                    showState={showingSearchResults}
                                    tasks={tasks}
                                />

                                {props.searchResults && props.searchResults.last_page > 1 && <TaskPagination label="Search result pages" links={props.searchResults.links} />}
                                {!showingSearchResults && props.workspace.taskView === 'overdue' && props.overdueTasks.last_page > 1 && <TaskPagination label="Overdue task pages" links={props.overdueTasks.links} />}
                                {!showingSearchResults && props.workspace.taskView === 'completed' && props.completedTasks.current_page < props.completedTasks.last_page && (
                                    <Button className="mx-auto mt-5 flex" disabled={loadingMoreCompleted} onClick={loadMoreCompleted} variant="secondary">
                                        {loadingMoreCompleted ? 'Loading…' : 'Load more'}
                                    </Button>
                                )}
                            </section>
                        </>
                    )}
                </TaskWorkspace>
            </div>

            {selectedTask && <TaskDetailsDrawer explorer={props.explorer} key={selectedTask.id} onClose={() => setSelectedTaskId(null)} task={selectedTask} today={props.today} />}
            <p aria-live="polite" className="sr-only">{announcement}</p>

            {recentlyCompletedTask && (
                <div aria-live="polite" className="fixed right-4 bottom-24 left-4 z-40 mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-border-strong bg-elevated p-3 shadow-2xl md:bottom-6">
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">Task completed</span>
                    <button className="focus-ring icon-text flex min-h-10 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-accent-ink hover:bg-surface-hover" onClick={undoCompletion} type="button"><Undo2 aria-hidden="true" size={15} />Undo</button>
                    <button aria-label="Dismiss" className="focus-ring grid size-10 place-items-center rounded-full text-muted hover:bg-surface-hover hover:text-foreground" onClick={() => setRecentlyCompletedTask(null)} type="button"><X aria-hidden="true" size={17} /></button>
                </div>
            )}
        </div>
    );
}

function TaskLocationBreadcrumb({ explorer, workspace }: {
    explorer: TaskExplorerViewData;
    workspace: TaskWorkspaceViewData;
}) {
    const folder = workspace.folderId === null ? null : explorer.folders.find((item) => item.id === workspace.folderId) ?? null;
    const backHref = folder
        ? taskNavigationHref('folder', emptyFilters, { folderId: folder.id })
        : taskNavigationHref('files', emptyFilters);
    const backLabel = folder ? `Back to ${folder.name}` : 'Back to Files';

    return (
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-bold text-muted hover:bg-surface-hover hover:text-foreground" href={backHref}>
                <ArrowLeft aria-hidden="true" size={17} />
                {backLabel}
            </Link>
            <nav aria-label="Task location" className="flex items-center gap-1.5 text-sm font-semibold text-muted">
                <Link className="focus-ring rounded-md hover:text-foreground" href={taskNavigationHref('files', emptyFilters)}>Files</Link>
                {folder && (
                    <>
                        <ChevronRight aria-hidden="true" size={14} />
                        <Link className="focus-ring max-w-48 truncate rounded-md hover:text-foreground" href={taskNavigationHref('folder', emptyFilters, { folderId: folder.id })}>{folder.name}</Link>
                    </>
                )}
                <ChevronRight aria-hidden="true" size={14} />
                <span aria-current="page" className="max-w-56 truncate text-foreground">{workspace.label}</span>
            </nav>
        </div>
    );
}

const emptyFilters: TaskSearchFilters = { search: '', status: 'all', taskProject: 'all', important: 'all' };

function selectedTasks(props: TasksPageProps, completedRows: TaskViewData[]): TaskViewData[] {
    if (props.searchResults !== null) return props.searchResults.data;
    return matchView(props.workspace.taskView, props.todayTasks, props.upcomingTasks, props.overdueTasks.data, completedRows);
}

function allVisibleTasks(props: TasksPageProps, completedRows: TaskViewData[]): TaskViewData[] {
    return [...props.todayTasks, ...props.upcomingTasks, ...props.overdueTasks.data, ...completedRows, ...(props.workspace.manualTasks ?? []), ...(props.searchResults?.data ?? [])];
}

function matchView(view: ProjectTaskView, today: TaskViewData[], upcoming: TaskViewData[], overdue: TaskViewData[], completed: TaskViewData[]) {
    if (view === 'upcoming') return upcoming;
    if (view === 'overdue') return overdue;
    if (view === 'completed') return completed;
    return today;
}

function emptyMessage(view: ProjectTaskView, location: TaskWorkspaceViewData['view']): string {
    const locationLabel = location === 'inbox' ? 'Inbox' : 'Project';
    if (view === 'upcoming') return `No upcoming Tasks in this ${locationLabel}.`;
    if (view === 'overdue') return `Nothing overdue in this ${locationLabel}.`;
    if (view === 'completed') return `No completed Tasks in this ${locationLabel}.`;
    return `No Tasks due today in this ${locationLabel}.`;
}
