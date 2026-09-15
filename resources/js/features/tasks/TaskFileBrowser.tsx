import { Link, router } from '@inertiajs/react';
import { ArrowLeft, ChevronRight, Folder, FolderKanban, GripVertical, Inbox, Move, Plus } from 'lucide-react';
import { useState } from 'react';
import type { DragEvent, ReactNode } from 'react';

import { Button } from '../../components/ui';
import { classNames } from '../../components/ui/classNames';
import { taskNavigationHref } from './taskNavigation';
import { TaskLocationCreateDialog } from './TaskLocationCreateDialog';
import { TaskProjectMoveDialog } from './TaskProjectMoveDialog';
import type { TaskExplorerViewData, TaskFolderViewData, TaskProjectViewData, TaskSearchFilters, TaskWorkspaceViewData } from './types';

type CreateLocation = 'folder' | 'project' | null;

export function TaskFileBrowser({ explorer, filters, onAnnounce, workspace }: {
    explorer: TaskExplorerViewData;
    filters: TaskSearchFilters;
    onAnnounce: (message: string) => void;
    workspace: TaskWorkspaceViewData;
}) {
    const [createLocation, setCreateLocation] = useState<CreateLocation>(null);
    const [draggingProject, setDraggingProject] = useState<TaskProjectViewData | null>(null);
    const [movingProject, setMovingProject] = useState<{ folderId: number | null; project: TaskProjectViewData } | null>(null);
    const selectedFolder = workspace.folderId === null
        ? null
        : explorer.folders.find((folder) => folder.id === workspace.folderId) ?? null;
    const browsingFolder = workspace.view === 'folder' && selectedFolder !== null;

    return (
        <section aria-labelledby="task-files-heading" className="mt-6">
            <FileBrowserHeader
                browsingFolder={browsingFolder}
                count={explorer.folders.length + explorer.rootProjects.length + 1}
                filters={filters}
                folder={selectedFolder}
                onCreate={setCreateLocation}
            />

            {browsingFolder ? (
                <>
                    {draggingProject && (
                        <RootProjectDropTarget
                            onDrop={() => moveProject(draggingProject, null, explorer.rootProjects.length, 'Files', onAnnounce)}
                        />
                    )}
                    <ProjectGrid
                        emptyMessage="This Folder has no Projects yet."
                        filters={filters}
                        folderId={selectedFolder.id}
                        onDragStateChange={setDraggingProject}
                        onMove={(project) => setMovingProject({ folderId: selectedFolder.id, project })}
                        projects={selectedFolder.projects}
                    />
                </>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <LocationCard
                        count={explorer.inboxCount}
                        countLabel="open Tasks"
                        href={taskNavigationHref('inbox', filters)}
                        icon={<Inbox size={42} strokeWidth={1.7} />}
                        label="Inbox"
                        tone="inbox"
                    />
                    {explorer.folders.map((folder) => (
                        <FolderCard
                            filters={filters}
                            folder={folder}
                            key={folder.id}
                            onAnnounce={onAnnounce}
                        />
                    ))}
                    {explorer.rootProjects.map((project) => (
                        <ProjectCard
                            filters={filters}
                            folderId={null}
                            key={project.id}
                            onDragStateChange={setDraggingProject}
                            onMove={() => setMovingProject({ folderId: null, project })}
                            project={project}
                        />
                    ))}
                </div>
            )}

            <TaskLocationCreateDialog folderId={null} kind="folder" onClose={() => setCreateLocation(null)} open={createLocation === 'folder'} />
            <TaskLocationCreateDialog folderId={browsingFolder ? selectedFolder.id : null} kind="project" onClose={() => setCreateLocation(null)} open={createLocation === 'project'} />
            {movingProject && (
                <TaskProjectMoveDialog
                    explorer={explorer}
                    folderId={movingProject.folderId}
                    onClose={() => setMovingProject(null)}
                    onMoved={onAnnounce}
                    project={movingProject.project}
                />
            )}
        </section>
    );
}

function FileBrowserHeader({ browsingFolder, count, filters, folder, onCreate }: {
    browsingFolder: boolean;
    count: number;
    filters: TaskSearchFilters;
    folder: TaskFolderViewData | null;
    onCreate: (kind: Exclude<CreateLocation, null>) => void;
}) {
    if (!browsingFolder) {
        return (
            <div className="mb-6 flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
                <div>
                    <div className="flex items-center justify-center gap-2 sm:justify-start">
                        <h2 className="text-sm font-bold tracking-[0.12em] text-secondary uppercase" id="task-files-heading">Files</h2>
                        <span className="rounded-full bg-surface-hover px-2 py-0.5 text-xs font-bold text-muted">{count}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted">Drag a Project onto a Folder to organize it.</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                    <Button onClick={() => onCreate('folder')} variant="secondary"><Plus size={17} />New Folder</Button>
                    <Button onClick={() => onCreate('project')}><Plus size={17} />New Project</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
                <Link className="focus-ring mb-3 inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-bold text-muted hover:bg-surface-hover hover:text-foreground" href={taskNavigationHref('files', filters)}>
                    <ArrowLeft aria-hidden="true" size={17} />
                    Back to Files
                </Link>
                <h2 className="text-2xl font-bold tracking-[-0.03em]" id="task-files-heading">{folder?.name}</h2>
                <p className="mt-1 text-sm text-muted">Choose a Project to open its Tasks.</p>
            </div>
            <div className="ml-auto flex gap-2">
                <Button onClick={() => onCreate('project')}><Plus size={17} />New Project</Button>
            </div>
        </div>
    );
}

function FolderCard({ filters, folder, onAnnounce }: {
    filters: TaskSearchFilters;
    folder: TaskFolderViewData;
    onAnnounce: (message: string) => void;
}) {
    const [dropActive, setDropActive] = useState(false);

    function dropProject(event: DragEvent<HTMLElement>) {
        event.preventDefault();
        event.stopPropagation();
        setDropActive(false);
        const draggedProject = readDraggedProject(event);
        if (!draggedProject) return;

        const sameFolder = draggedProject.folderId === folder.id;
        const position = Math.max(0, folder.projects.length - (sameFolder ? 1 : 0));
        moveProject(draggedProject.project, folder.id, position, folder.name, onAnnounce);
    }

    return (
        <div
            className={classNames('relative rounded-3xl transition-[background-color,box-shadow]', dropActive && 'bg-[color-mix(in_srgb,var(--module-accent)_12%,transparent)] ring-2 ring-[var(--module-accent)]')}
            onDragEnter={(event) => {
                if (hasProjectDrag(event)) setDropActive(true);
            }}
            onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropActive(false);
            }}
            onDragOver={(event) => {
                if (!hasProjectDrag(event)) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
            }}
            onDrop={dropProject}
        >
            <LocationCard
                count={folder.projectCount}
                countLabel={folder.projectCount === 1 ? 'Project' : 'Projects'}
                detail={folder.openTaskCount + ' open ' + (folder.openTaskCount === 1 ? 'Task' : 'Tasks')}
                href={taskNavigationHref('folder', filters, { folderId: folder.id })}
                icon={<Folder fill="currentColor" size={52} strokeWidth={1.5} />}
                label={folder.name}
                tone="folder"
            />
            {dropActive && <span className="pointer-events-none absolute inset-x-4 bottom-4 rounded-xl bg-[var(--module-accent)] px-3 py-2 text-center text-xs font-bold text-accent-foreground">Drop Project here</span>}
        </div>
    );
}

function ProjectGrid({ emptyMessage, filters, folderId, onDragStateChange, onMove, projects }: {
    emptyMessage: string;
    filters: TaskSearchFilters;
    folderId: number;
    onDragStateChange: (project: TaskProjectViewData | null) => void;
    onMove: (project: TaskProjectViewData) => void;
    projects: TaskProjectViewData[];
}) {
    if (projects.length === 0) {
        return <p className="rounded-3xl border border-dashed border-border-strong px-5 py-12 text-center text-sm text-muted">{emptyMessage}</p>;
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
                <ProjectCard
                    filters={filters}
                    folderId={folderId}
                    key={project.id}
                    onDragStateChange={onDragStateChange}
                    onMove={() => onMove(project)}
                    project={project}
                />
            ))}
        </div>
    );
}

function ProjectCard({ filters, folderId, onDragStateChange, onMove, project }: {
    filters: TaskSearchFilters;
    folderId: number | null;
    onDragStateChange: (project: TaskProjectViewData | null) => void;
    onMove: () => void;
    project: TaskProjectViewData;
}) {
    const [dragging, setDragging] = useState(false);

    return (
        <LocationCard
            count={project.openTaskCount}
            countLabel={project.openTaskCount === 1 ? 'open Task' : 'open Tasks'}
            draggable
            dragging={dragging}
            href={taskNavigationHref('project', filters, { projectId: project.id })}
            icon={<FolderKanban size={46} strokeWidth={1.6} />}
            label={project.name}
            onDragEnd={() => {
                setDragging(false);
                onDragStateChange(null);
            }}
            onDragStart={(event) => {
                setCardDragImage(event);
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('application/x-achelife-project', JSON.stringify({ folderId, project }));
                setDragging(true);
                onDragStateChange(project);
            }}
            onMove={onMove}
            tone="project"
        />
    );
}

function LocationCard({ count, countLabel, detail, draggable = false, dragging = false, href, icon, label, onDragEnd, onDragStart, onMove, tone }: {
    count: number;
    countLabel: string;
    detail?: string;
    draggable?: boolean;
    dragging?: boolean;
    href: string;
    icon: ReactNode;
    label: string;
    onDragEnd?: () => void;
    onDragStart?: (event: DragEvent<HTMLElement>) => void;
    onMove?: () => void;
    tone: 'folder' | 'project' | 'inbox';
}) {
    return (
        <article
            aria-grabbed={draggable ? dragging : undefined}
            className={classNames(
                'group relative rounded-3xl border border-border-subtle bg-surface transition-[transform,opacity,border-color,background-color,box-shadow] hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--module-accent)_42%,var(--border-strong))] hover:bg-elevated hover:shadow-[var(--shadow-raised)]',
                draggable && 'cursor-grab active:cursor-grabbing',
                dragging && 'scale-[0.98] border-dashed opacity-35',
            )}
            draggable={draggable}
            onDragEnd={onDragEnd}
            onDragStart={onDragStart}
        >
            <Link aria-label={'Open ' + label} className="focus-ring flex min-h-44 flex-col rounded-3xl p-5" draggable={false} href={href}>
                <span className={classNames(
                    'grid size-16 place-items-center rounded-2xl transition-transform group-hover:scale-105',
                    tone === 'folder' && 'bg-[color-mix(in_srgb,var(--module-accent)_18%,transparent)] text-accent-ink',
                    tone === 'project' && 'bg-info/12 text-info',
                    tone === 'inbox' && 'bg-surface-hover text-secondary',
                )}>{icon}</span>
                <span className="mt-5 flex min-w-0 items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-lg font-bold">{label}</span>
                    <ChevronRight className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" size={18} />
                </span>
                <span className="mt-1 text-sm text-muted">{count} {countLabel}{detail ? ' · ' + detail : ''}</span>
            </Link>
            {draggable && <GripVertical aria-hidden="true" className="pointer-events-none absolute top-4 right-4 text-muted" size={18} />}
            {onMove && (
                <button aria-label={'Move ' + label} className="focus-ring absolute right-3 bottom-3 grid size-10 place-items-center rounded-full text-muted hover:bg-surface-hover hover:text-foreground" onClick={onMove} type="button">
                    <Move aria-hidden="true" size={16} />
                </button>
            )}
        </article>
    );
}

function RootProjectDropTarget({ onDrop }: { onDrop: () => void }) {
    return (
        <div
            className="mb-4 rounded-2xl border-2 border-dashed border-[var(--module-accent)] bg-[color-mix(in_srgb,var(--module-accent)_9%,transparent)] px-4 py-3 text-center text-sm font-bold text-accent-ink"
            onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(event) => {
                event.preventDefault();
                onDrop();
            }}
        >
            Drop here to move the Project out of this Folder
        </div>
    );
}

function hasProjectDrag(event: DragEvent<HTMLElement>): boolean {
    return Array.from(event.dataTransfer.types).includes('application/x-achelife-project');
}

function setCardDragImage(event: DragEvent<HTMLElement>) {
    const cardBounds = event.currentTarget.getBoundingClientRect();
    const grabOffsetX = Math.max(0, Math.min(cardBounds.width, event.clientX - cardBounds.left));
    const grabOffsetY = Math.max(0, Math.min(cardBounds.height, event.clientY - cardBounds.top));
    event.dataTransfer.setDragImage(event.currentTarget, grabOffsetX, grabOffsetY);
}

function readDraggedProject(event: DragEvent<HTMLElement>): { folderId: number | null; project: TaskProjectViewData } | null {
    const value = event.dataTransfer.getData('application/x-achelife-project');
    return value ? JSON.parse(value) as { folderId: number | null; project: TaskProjectViewData } : null;
}

function moveProject(
    project: TaskProjectViewData,
    folderId: number | null,
    position: number,
    destinationName: string,
    onAnnounce: (message: string) => void,
) {
    router.put(`/task-projects/${project.id}/move`, {
        task_folder_id: folderId,
        position,
    }, {
        preserveScroll: true,
        onSuccess: () => onAnnounce(`${project.name} moved to ${destinationName}.`),
    });
}
