import { Link, router } from '@inertiajs/react';
import { Archive, ArrowLeft, ChevronRight, Folder, FolderKanban, Inbox, MoreHorizontal, Plus, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import type { DragEvent, ReactNode } from 'react';

import { Button, Dialog } from '../../components/ui';
import { classNames } from '../../components/ui/classNames';
import { taskNavigationHref } from './taskNavigation';
import { TaskLocationActionsDialog, type TaskLocationActionTarget } from './TaskLocationActionsDialog';
import { TaskLocationCreateDialog } from './TaskLocationCreateDialog';
import type { TaskExplorerViewData, TaskFolderViewData, TaskProjectViewData, TaskSearchFilters, TaskWorkspaceViewData } from './types';

type CreateLocation = 'folder' | 'project' | null;

export function TaskFileBrowser({ explorer, filters, onAnnounce, workspace }: { explorer: TaskExplorerViewData; filters: TaskSearchFilters; onAnnounce: (message: string) => void; workspace: TaskWorkspaceViewData }) {
    const [createLocation, setCreateLocation] = useState<CreateLocation>(null);
    const [draggingProject, setDraggingProject] = useState<TaskProjectViewData | null>(null);
    const [managingLocation, setManagingLocation] = useState<TaskLocationActionTarget | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    const selectedFolder = workspace.folderId === null ? null : explorer.folders.find((folder) => folder.id === workspace.folderId) ?? null;
    const browsingFolder = workspace.view === 'folder' && selectedFolder !== null;

    return <section aria-labelledby="task-files-heading" className="mt-6">
        <Header browsingFolder={browsingFolder} count={explorer.folders.length + explorer.rootProjects.length + 1} filters={filters} folder={selectedFolder} onArchived={() => setShowArchived(true)} onCreate={setCreateLocation} />
        {browsingFolder ? <>
            {draggingProject && <RootDropTarget onDrop={() => moveProject(draggingProject, null, explorer.rootProjects.length, 'Files', onAnnounce)} />}
            <ProjectGrid emptyMessage="This Folder has no Projects yet." filters={filters} folderId={selectedFolder.id} onDragStateChange={setDraggingProject} onManage={(project) => setManagingLocation(projectTarget(project))} projects={selectedFolder.projects} />
        </> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <LocationCard count={explorer.inboxCount} countLabel="open Tasks" href={taskNavigationHref('inbox', filters)} icon={<Inbox size={31} strokeWidth={1.8} />} label="Inbox" tone="inbox" />
            {explorer.folders.map((folder) => <FolderCard filters={filters} folder={folder} key={folder.id} onAnnounce={onAnnounce} onManage={() => setManagingLocation(folderTarget(folder))} />)}
            {explorer.rootProjects.map((project) => <ProjectCard filters={filters} folderId={null} key={project.id} onDragStateChange={setDraggingProject} onManage={() => setManagingLocation(projectTarget(project))} project={project} />)}
        </div>}
        <TaskLocationCreateDialog folderId={null} kind="folder" onClose={() => setCreateLocation(null)} open={createLocation === 'folder'} />
        <TaskLocationCreateDialog folderId={browsingFolder ? selectedFolder.id : null} kind="project" onClose={() => setCreateLocation(null)} open={createLocation === 'project'} />
        <TaskLocationActionsDialog onClose={() => setManagingLocation(null)} target={managingLocation} />
        <ArchivedDialog explorer={explorer} onClose={() => setShowArchived(false)} open={showArchived} />
    </section>;
}

function Header({ browsingFolder, count, filters, folder, onArchived, onCreate }: { browsingFolder: boolean; count: number; filters: TaskSearchFilters; folder: TaskFolderViewData | null; onArchived: () => void; onCreate: (kind: Exclude<CreateLocation, null>) => void }) {
    if (browsingFolder) return <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><Link className="focus-ring mb-3 inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-bold text-muted hover:bg-surface-hover hover:text-foreground" href={taskNavigationHref('files', filters)}><ArrowLeft size={17} />Files</Link><h2 className="text-2xl font-bold tracking-[-0.03em]" id="task-files-heading">{folder?.name}</h2><p className="mt-1 text-sm text-muted">Choose a Project to open its Tasks.</p></div><Button onClick={() => onCreate('project')}><Plus size={17} />New Project</Button></div>;

    return <div className="mb-6 flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left"><div><div className="flex items-center justify-center gap-2 sm:justify-start"><h2 className="text-sm font-bold tracking-[0.12em] text-secondary uppercase" id="task-files-heading">Files</h2><span className="rounded-full bg-surface-hover px-2 py-0.5 text-xs font-bold text-muted">{count}</span></div><p className="mt-2 text-sm text-muted">Keep Projects together in Folders.</p></div><div className="flex flex-wrap justify-center gap-2"><Button onClick={onArchived} size="small" variant="ghost"><Archive size={16} />Archived</Button><Button onClick={() => onCreate('folder')} size="small" variant="secondary"><Plus size={16} />New Folder</Button><Button onClick={() => onCreate('project')} size="small"><Plus size={16} />New Project</Button></div></div>;
}

function FolderCard({ filters, folder, onAnnounce, onManage }: { filters: TaskSearchFilters; folder: TaskFolderViewData; onAnnounce: (message: string) => void; onManage: () => void }) {
    const [dropActive, setDropActive] = useState(false);
    function drop(event: DragEvent<HTMLElement>) { event.preventDefault(); setDropActive(false); const dragged = draggedProject(event); if (dragged) moveProject(dragged.project, folder.id, Math.max(0, folder.projects.length - (dragged.folderId === folder.id ? 1 : 0)), folder.name, onAnnounce); }
    return <div className={classNames('relative rounded-2xl transition-[background-color,box-shadow]', dropActive && 'bg-[color-mix(in_srgb,var(--module-accent)_12%,transparent)] ring-2 ring-[var(--module-accent)]')} onDragEnter={(event) => { if (isProjectDrag(event)) setDropActive(true); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropActive(false); }} onDragOver={(event) => { if (isProjectDrag(event)) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; } }} onDrop={drop}><LocationCard color={folder.color} count={folder.projectCount} countLabel={folder.projectCount === 1 ? 'Project' : 'Projects'} detail={`${folder.openTaskCount} open ${folder.openTaskCount === 1 ? 'Task' : 'Tasks'}`} href={taskNavigationHref('folder', filters, { folderId: folder.id })} icon={<Folder fill="currentColor" size={37} strokeWidth={1.6} />} label={folder.name} onManage={onManage} tone="folder" />{dropActive && <span className="pointer-events-none absolute inset-x-4 bottom-3 rounded-lg bg-[var(--module-accent)] px-3 py-1.5 text-center text-xs font-bold text-accent-foreground">Drop Project here</span>}</div>;
}

function ProjectGrid({ emptyMessage, filters, folderId, onDragStateChange, onManage, projects }: { emptyMessage: string; filters: TaskSearchFilters; folderId: number; onDragStateChange: (project: TaskProjectViewData | null) => void; onManage: (project: TaskProjectViewData) => void; projects: TaskProjectViewData[] }) {
    if (projects.length === 0) return <p className="rounded-2xl border border-dashed border-border-strong px-5 py-12 text-center text-sm text-muted">{emptyMessage}</p>;
    return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{projects.map((project) => <ProjectCard filters={filters} folderId={folderId} key={project.id} onDragStateChange={onDragStateChange} onManage={() => onManage(project)} project={project} />)}</div>;
}

function ProjectCard({ filters, folderId, onDragStateChange, onManage, project }: { filters: TaskSearchFilters; folderId: number | null; onDragStateChange: (project: TaskProjectViewData | null) => void; onManage: () => void; project: TaskProjectViewData }) {
    const [dragging, setDragging] = useState(false);
    return <LocationCard color={project.color} count={project.openTaskCount} countLabel={project.openTaskCount === 1 ? 'open Task' : 'open Tasks'} draggable dragging={dragging} href={taskNavigationHref('project', filters, { projectId: project.id })} icon={<FolderKanban size={34} strokeWidth={1.7} />} label={project.name} onDragEnd={() => { setDragging(false); onDragStateChange(null); }} onDragStart={(event) => { setDragImage(event); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('application/x-achelife-project', JSON.stringify({ folderId, project })); setDragging(true); onDragStateChange(project); }} onManage={onManage} tone="project" />;
}

function LocationCard({ color, count, countLabel, detail, draggable = false, dragging = false, href, icon, label, onDragEnd, onDragStart, onManage, tone }: { color?: string | null; count: number; countLabel: string; detail?: string; draggable?: boolean; dragging?: boolean; href: string; icon: ReactNode; label: string; onDragEnd?: () => void; onDragStart?: (event: DragEvent<HTMLElement>) => void; onManage?: () => void; tone: 'folder' | 'project' | 'inbox' }) {
    const colorStyle = color === undefined || color === null ? undefined : { backgroundColor: `${color}20`, color };
    return <article aria-grabbed={draggable ? dragging : undefined} className={classNames('group relative rounded-2xl border border-border-subtle bg-surface transition-[transform,opacity,border-color,background-color,box-shadow] hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--module-accent)_42%,var(--border-strong))] hover:bg-elevated', draggable && 'cursor-grab active:cursor-grabbing', dragging && 'scale-[0.98] border-dashed opacity-35')} draggable={draggable} onDragEnd={onDragEnd} onDragStart={onDragStart}><Link aria-label={'Open ' + label} className="focus-ring flex min-h-36 flex-col rounded-2xl p-5" draggable={false} href={href}><span className={classNames('grid size-13 place-items-center rounded-xl', color === null || color === undefined ? defaultIconTone(tone) : '')} style={colorStyle}>{icon}</span><span className="mt-4 min-w-0 truncate text-base font-bold">{label}</span><span className="mt-1 flex items-center justify-between gap-2 text-sm text-muted"><span>{count} {countLabel}{detail ? ' · ' + detail : ''}</span><ChevronRight className="shrink-0" size={17} /></span></Link>{onManage && <button aria-label={'Manage ' + label} className="focus-ring absolute top-3 right-3 grid size-9 place-items-center rounded-full text-muted hover:bg-surface-hover hover:text-foreground" onClick={onManage} type="button"><MoreHorizontal size={18} /></button>}</article>;
}

function defaultIconTone(tone: 'folder' | 'project' | 'inbox'): string {
    if (tone === 'folder') return 'bg-[color-mix(in_srgb,var(--module-accent)_18%,transparent)] text-accent-ink';
    if (tone === 'project') return 'bg-info/12 text-info';

    return 'bg-surface-hover text-secondary';
}

function ArchivedDialog({ explorer, onClose, open }: { explorer: TaskExplorerViewData; onClose: () => void; open: boolean }) { const hasArchived = explorer.archivedFolders.length > 0 || explorer.archivedProjects.length > 0; return <Dialog description="Archived locations keep their Tasks and can be restored at any time." onClose={onClose} open={open} title="Archived Files">{hasArchived ? <div className="space-y-3">{explorer.archivedFolders.map((folder) => <ArchivedRow key={'folder-' + folder.id} kind="Folder" name={folder.name} onReactivate={() => reactivate('folders', folder.id)} summary={`${folder.projectCount} Projects · ${folder.openTaskCount} Tasks`} />)}{explorer.archivedProjects.map((project) => <ArchivedRow key={'project-' + project.id} kind="Project" name={project.name} onReactivate={() => reactivate('projects', project.id)} summary={`${project.openTaskCount} Tasks`} />)}</div> : <p className="py-6 text-center text-sm text-muted">No archived Folders or Projects.</p>}</Dialog>; }
function ArchivedRow({ kind, name, onReactivate, summary }: { kind: 'Folder' | 'Project'; name: string; onReactivate: () => void; summary: string }) { return <div className="flex items-center justify-between gap-3 rounded-2xl border border-border-subtle p-4"><div className="min-w-0"><p className="truncate font-bold">{name}</p><p className="text-sm text-muted">{kind} · {summary}</p></div><Button onClick={onReactivate} size="small" variant="secondary"><RotateCcw size={15} />Reactivate</Button></div>; }
function RootDropTarget({ onDrop }: { onDrop: () => void }) { return <div className="mb-4 rounded-xl border border-dashed border-[var(--module-accent)] px-4 py-3 text-center text-sm font-bold text-accent-ink" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); onDrop(); }}>Drop here to move the Project to Files root</div>; }
function isProjectDrag(event: DragEvent<HTMLElement>): boolean { return Array.from(event.dataTransfer.types).includes('application/x-achelife-project'); }
function draggedProject(event: DragEvent<HTMLElement>): { folderId: number | null; project: TaskProjectViewData } | null { const value = event.dataTransfer.getData('application/x-achelife-project'); return value ? JSON.parse(value) as { folderId: number | null; project: TaskProjectViewData } : null; }
function setDragImage(event: DragEvent<HTMLElement>) { const bounds = event.currentTarget.getBoundingClientRect(); event.dataTransfer.setDragImage(event.currentTarget, Math.max(0, Math.min(bounds.width, event.clientX - bounds.left)), Math.max(0, Math.min(bounds.height, event.clientY - bounds.top))); }
function moveProject(project: TaskProjectViewData, folderId: number | null, position: number, destination: string, onSuccess: (message: string) => void) { router.put(`/task-projects/${project.id}/move`, { task_folder_id: folderId, position: Math.max(0, position) }, { preserveScroll: true, onSuccess: () => onSuccess(`${project.name} moved to ${destination}.`) }); }
function reactivate(kind: 'folders' | 'projects', id: number) { router.post(`/task-${kind}/${id}/reactivate`, {}, { preserveScroll: true }); }
function folderTarget(folder: TaskFolderViewData): TaskLocationActionTarget { return { id: folder.id, kind: 'folder', name: folder.name, color: folder.color, openTaskCount: folder.openTaskCount, projectCount: folder.projectCount }; }
function projectTarget(project: TaskProjectViewData): TaskLocationActionTarget { return { id: project.id, kind: 'project', name: project.name, color: project.color, openTaskCount: project.openTaskCount }; }
