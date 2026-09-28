import { router } from '@inertiajs/react';
import { RotateCcw } from 'lucide-react';

import { Button } from '../../components/ui';
import type { TaskExplorerViewData } from './types';

export function TaskArchivedBrowser({ explorer }: { explorer: TaskExplorerViewData }) {
    const hasArchivedLocations = explorer.archivedFolders.length > 0 || explorer.archivedProjects.length > 0;

    return (
        <section aria-labelledby="task-archived-heading" className="mt-6">
            <div className="mb-6 rounded-[var(--radius-panel)] border border-border-subtle bg-surface px-5 py-4 sm:px-6">
                <h2 className="text-sm font-bold tracking-[0.12em] text-secondary uppercase" id="task-archived-heading">Archived Files</h2>
                <p className="mt-2 text-sm text-muted">Archived Folders and Projects keep their Tasks and can be restored at any time.</p>
            </div>
            {hasArchivedLocations ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {explorer.archivedFolders.map((folder) => (
                        <ArchivedLocationCard
                            key={`folder-${folder.id}`}
                            kind="Folder"
                            name={folder.name}
                            onReactivate={() => reactivateLocation('folders', folder.id)}
                            summary={`${folder.projectCount} Projects · ${folder.openTaskCount} Tasks`}
                        />
                    ))}
                    {explorer.archivedProjects.map((project) => (
                        <ArchivedLocationCard
                            key={`project-${project.id}`}
                            kind="Project"
                            name={project.name}
                            onReactivate={() => reactivateLocation('projects', project.id)}
                            summary={`${project.openTaskCount} Tasks`}
                        />
                    ))}
                </div>
            ) : (
                <p className="rounded-2xl border border-dashed border-border-strong bg-surface px-5 py-12 text-center text-sm text-muted">No archived Folders or Projects.</p>
            )}
        </section>
    );
}

function ArchivedLocationCard({ kind, name, onReactivate, summary }: { kind: 'Folder' | 'Project'; name: string; onReactivate: () => void; summary: string }) {
    return (
        <article className="flex min-h-32 flex-col justify-between gap-4 rounded-2xl border border-border-subtle bg-surface p-5">
            <div className="min-w-0">
                <h3 className="truncate font-bold">{name}</h3>
                <p className="mt-1 text-sm text-muted">{kind} · {summary}</p>
            </div>
            <Button aria-label={`Reactivate ${kind} ${name}`} className="self-start" onClick={onReactivate} size="small" variant="secondary">
                <RotateCcw size={15} />Reactivate
            </Button>
        </article>
    );
}

function reactivateLocation(kind: 'folders' | 'projects', id: number) {
    router.post(`/task-${kind}/${id}/reactivate`, {}, { preserveScroll: true });
}
