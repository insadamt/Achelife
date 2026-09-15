import { Link, router } from '@inertiajs/react';
import { ArrowDown, ArrowUp, CalendarDays, CheckCircle2, ChevronDown, ChevronRight, Clock3, Folder, FolderKanban, Folders, GripVertical, Inbox, Move, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import type { DragEvent, ReactNode } from 'react';

import { classNames } from '../../components/ui/classNames';
import { TaskProjectMoveDialog } from './TaskProjectMoveDialog';
import { taskNavigationHref } from './taskNavigation';
import type { TaskExplorerViewData, TaskProjectViewData, TaskSearchFilters, TaskWorkspaceViewData, TaskWorkspaceView } from './types';

interface TaskExplorerProps {
    explorer: TaskExplorerViewData;
    onAnnounce: (message: string) => void;
    onNavigate?: () => void;
    searchFilters: TaskSearchFilters;
    workspace: TaskWorkspaceViewData;
}

export function TaskExplorer({ explorer, onAnnounce, onNavigate, searchFilters, workspace }: TaskExplorerProps) {
    const [collapsedFolderIds, setCollapsedFolderIds] = useState<number[]>(() => {
        if (typeof window === 'undefined') return [];
        const saved = window.localStorage.getItem('task-explorer-collapsed-folders');
        return saved ? JSON.parse(saved) as number[] : [];
    });
    const [movingProject, setMovingProject] = useState<{ project: TaskProjectViewData; folderId: number | null } | null>(null);
    const [dropTarget, setDropTarget] = useState<string | null>(null);
    const smartViews: { view: Exclude<TaskWorkspaceView, 'folder' | 'project'>; label: string; icon: ReactNode; count?: number }[] = [
        { view: 'files', label: 'Files', icon: <Folders size={17} /> },
        { view: 'today', label: 'Today', icon: <CalendarDays size={17} /> },
        { view: 'inbox', label: 'Inbox', icon: <Inbox size={17} />, count: explorer.inboxCount },
        { view: 'upcoming', label: 'Upcoming', icon: <Clock3 size={17} /> },
        { view: 'overdue', label: 'Overdue', icon: <TriangleAlert size={17} /> },
        { view: 'completed', label: 'Completed', icon: <CheckCircle2 size={17} /> },
    ];

    function toggleFolder(folderId: number) {
        setCollapsedFolderIds((current) => {
            const next = current.includes(folderId) ? current.filter((id) => id !== folderId) : [...current, folderId];
            window.localStorage.setItem('task-explorer-collapsed-folders', JSON.stringify(next));
            return next;
        });
    }

    function reorderFolder(draggedFolderId: number, targetFolderId: number) {
        if (draggedFolderId === targetFolderId) return;
        const orderedIds = explorer.folders.map((folder) => folder.id).filter((id) => id !== draggedFolderId);
        orderedIds.splice(orderedIds.indexOf(targetFolderId), 0, draggedFolderId);
        router.put('/task-folders/order', { folder_ids: orderedIds }, {
            preserveScroll: true,
            onSuccess: () => onAnnounce('Folder order updated.'),
        });
    }

    function moveFolderBy(folderId: number, direction: -1 | 1) {
        const orderedIds = explorer.folders.map((folder) => folder.id);
        const currentIndex = orderedIds.indexOf(folderId);
        const nextIndex = currentIndex + direction;
        if (nextIndex < 0 || nextIndex >= orderedIds.length) return;
        const currentId = orderedIds[currentIndex];
        const nextId = orderedIds[nextIndex];
        if (currentId === undefined || nextId === undefined) return;
        orderedIds[currentIndex] = nextId;
        orderedIds[nextIndex] = currentId;
        router.put('/task-folders/order', { folder_ids: orderedIds }, {
            preserveScroll: true,
            onSuccess: () => onAnnounce('Folder order updated.'),
        });
    }

    function dropIntoContainer(event: DragEvent, folderId: number | null, projectCount: number, taskCount?: number) {
        event.preventDefault();
        const projectPayload = readDragPayload(event, 'application/x-achelife-project');
        const taskPayload = readDragPayload(event, 'application/x-achelife-task');
        if (projectPayload) {
            const sameContainer = projectPayload.parentId === folderId;
            moveProject(projectPayload.id, folderId, Math.max(0, projectCount - (sameContainer ? 1 : 0)), onAnnounce);
        } else if (taskPayload && taskCount !== undefined) {
            const destinationProjectId = folderId;
            const sameContainer = taskPayload.parentId === destinationProjectId;
            moveTask(taskPayload.id, destinationProjectId, Math.max(0, taskCount - (sameContainer ? 1 : 0)), onAnnounce);
        }
    }

    return (
        <nav aria-label="Task Explorer" className="space-y-5">
            <div>
                <p className="px-2 text-xs font-bold tracking-[0.14em] text-muted uppercase">Views</p>
                <div className="mt-2 space-y-1">
                    {smartViews.map((item) => (
                        <ExplorerLink active={workspace.view === item.view} count={item.count} href={taskNavigationHref(item.view, searchFilters)} icon={item.icon} key={item.view} onClick={onNavigate}>
                            {item.label}
                        </ExplorerLink>
                    ))}
                </div>
            </div>

            <div>
                <p className="px-2 text-xs font-bold tracking-[0.14em] text-muted uppercase">Folders</p>
                <div className="mt-2 space-y-1">
                    {explorer.folders.map((folder, folderIndex) => {
                        const collapsed = collapsedFolderIds.includes(folder.id);
                        return (
                            <div
                                className={classNames('rounded-xl transition-[background-color,box-shadow]', dropTarget === `folder-${folder.id}` && 'bg-surface-hover ring-2 ring-[var(--module-accent)]/30')}
                                draggable
                                key={folder.id}
                                onDragStart={(event) => event.dataTransfer.setData('application/x-achelife-folder', String(folder.id))}
                                onDragEnter={() => setDropTarget(`folder-${folder.id}`)}
                                onDragLeave={() => setDropTarget(null)}
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={(event) => {
                                    setDropTarget(null);
                                    const draggedFolderId = Number(event.dataTransfer.getData('application/x-achelife-folder'));
                                    if (draggedFolderId) reorderFolder(draggedFolderId, folder.id);
                                    else dropIntoContainer(event, folder.id, folder.projects.length);
                                }}
                            >
                                <div className="group flex items-center gap-1 rounded-xl hover:bg-surface-hover">
                                    <GripVertical aria-hidden="true" className="cursor-grab text-muted opacity-0 group-hover:opacity-100" size={15} />
                                    <button aria-expanded={!collapsed} aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${folder.name}`} className="focus-ring grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-elevated hover:text-foreground" onClick={() => toggleFolder(folder.id)} type="button">
                                        {collapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                                    </button>
                                    <ExplorerLink active={workspace.view === 'folder' && workspace.folderId === folder.id} count={folder.openTaskCount} href={taskNavigationHref('folder', searchFilters, { folderId: folder.id })} icon={<Folder aria-hidden="true" size={16} />} onClick={onNavigate}>{folder.name}</ExplorerLink>
                                    <button aria-label={`Move ${folder.name} up`} className="focus-ring grid size-9 shrink-0 place-items-center rounded-lg text-muted opacity-0 hover:bg-elevated hover:text-foreground disabled:hidden group-focus-within:opacity-100 group-hover:opacity-100" disabled={folderIndex === 0} onClick={() => moveFolderBy(folder.id, -1)} type="button"><ArrowUp size={13} /></button>
                                    <button aria-label={`Move ${folder.name} down`} className="focus-ring grid size-9 shrink-0 place-items-center rounded-lg text-muted opacity-0 hover:bg-elevated hover:text-foreground disabled:hidden group-focus-within:opacity-100 group-hover:opacity-100" disabled={folderIndex === explorer.folders.length - 1} onClick={() => moveFolderBy(folder.id, 1)} type="button"><ArrowDown size={13} /></button>
                                </div>
                                {!collapsed && (
                                    <div className="ml-5 space-y-1 border-l border-border-subtle pl-2">
                                        {folder.projects.map((project) => (
                                            <ProjectLink folderId={folder.id} key={project.id} onAnnounce={onAnnounce} onMove={() => setMovingProject({ project, folderId: folder.id })} onNavigate={onNavigate} project={project} searchFilters={searchFilters} selected={workspace.view === 'project' && workspace.projectId === project.id} />
                                        ))}
                                        {folder.projects.length === 0 && <p className="px-3 py-2 text-xs text-muted">Drop Projects here</p>}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className={classNames('rounded-xl transition-[background-color,box-shadow]', dropTarget === 'root' && 'bg-surface-hover ring-2 ring-[var(--module-accent)]/30')} onDragEnter={() => setDropTarget('root')} onDragLeave={() => setDropTarget(null)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
                setDropTarget(null);
                dropIntoContainer(event, null, explorer.rootProjects.length, explorer.inboxCount);
            }}>
                <p className="px-2 text-xs font-bold tracking-[0.14em] text-muted uppercase">Root Projects</p>
                <div className="mt-2 space-y-1">
                    {explorer.rootProjects.map((project) => (
                        <ProjectLink folderId={null} key={project.id} onAnnounce={onAnnounce} onMove={() => setMovingProject({ project, folderId: null })} onNavigate={onNavigate} project={project} searchFilters={searchFilters} selected={workspace.view === 'project' && workspace.projectId === project.id} />
                    ))}
                    {explorer.rootProjects.length === 0 && <p className="px-3 py-2 text-xs text-muted">No root Projects</p>}
                </div>
            </div>

            {movingProject && <TaskProjectMoveDialog explorer={explorer} folderId={movingProject.folderId} onClose={() => setMovingProject(null)} onMoved={onAnnounce} project={movingProject.project} />}
        </nav>
    );
}

function ProjectLink({ folderId, onAnnounce, onMove, onNavigate, project, searchFilters, selected }: {
    folderId: number | null;
    onAnnounce: (message: string) => void;
    onMove: () => void;
    onNavigate?: () => void;
    project: TaskProjectViewData;
    searchFilters: TaskSearchFilters;
    selected: boolean;
}) {
    const [dropActive, setDropActive] = useState(false);

    return (
        <div
            className={classNames('group flex items-center gap-1 rounded-xl transition-[background-color,box-shadow]', dropActive && 'bg-surface-hover ring-2 ring-[var(--module-accent)]/30')}
            draggable
            onDragEnter={() => setDropActive(true)}
            onDragLeave={() => setDropActive(false)}
            onDragStart={(event) => event.dataTransfer.setData('application/x-achelife-project', JSON.stringify({ id: project.id, parentId: folderId }))}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setDropActive(false);
                const projectPayload = readDragPayload(event, 'application/x-achelife-project');
                const taskPayload = readDragPayload(event, 'application/x-achelife-task');
                if (projectPayload) moveProject(projectPayload.id, folderId, project.position, onAnnounce);
                if (taskPayload) moveTask(taskPayload.id, project.id, project.openTaskCount - (taskPayload.parentId === project.id ? 1 : 0), onAnnounce);
            }}
        >
            <GripVertical aria-hidden="true" className="cursor-grab text-muted opacity-0 group-hover:opacity-100" size={14} />
            <ExplorerLink active={selected} count={project.openTaskCount} href={taskNavigationHref('project', searchFilters, { projectId: project.id })} icon={<FolderKanban size={16} />} onClick={onNavigate}>{project.name}</ExplorerLink>
            <button aria-label={`Move ${project.name}`} className="focus-ring grid size-9 shrink-0 place-items-center rounded-lg text-muted opacity-0 hover:bg-surface-hover hover:text-foreground group-focus-within:opacity-100 group-hover:opacity-100" onClick={onMove} type="button"><Move size={14} /></button>
        </div>
    );
}

function ExplorerLink({ active, children, count, href, icon, onClick }: {
    active: boolean;
    children: ReactNode;
    count?: number;
    href: string;
    icon: ReactNode;
    onClick?: () => void;
}) {
    return (
        <Link className={classNames('focus-ring flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-xl px-3 text-sm font-semibold', active ? 'bg-[color-mix(in_srgb,var(--module-accent)_14%,transparent)] text-accent-ink' : 'text-secondary hover:bg-surface-hover hover:text-foreground')} href={href} onClick={onClick}>
            {icon}<span className="truncate">{children}</span>{count !== undefined && <span className="ml-auto text-xs text-muted">{count}</span>}
        </Link>
    );
}

function readDragPayload(event: DragEvent, type: string): { id: number; parentId: number | null } | null {
    const value = event.dataTransfer.getData(type);
    return value ? JSON.parse(value) as { id: number; parentId: number | null } : null;
}

function moveProject(projectId: number, folderId: number | null, position: number, announce: (message: string) => void) {
    router.put(`/task-projects/${projectId}/move`, { task_folder_id: folderId, position: Math.max(0, position) }, { preserveScroll: true, onSuccess: () => announce('Project moved.') });
}

function moveTask(taskId: number, projectId: number | null, position: number, announce: (message: string) => void) {
    router.put(`/tasks/${taskId}/move`, { task_project_id: projectId, position: Math.max(0, position) }, { preserveScroll: true, onSuccess: () => announce('Task moved.') });
}
