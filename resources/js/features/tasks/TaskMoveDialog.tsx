import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import { Button, Dialog, SelectField } from '../../components/ui';
import type { TaskExplorerViewData, TaskViewData } from './types';

export function TaskMoveDialog({ explorer, onClose, onMoved, task }: {
    explorer: TaskExplorerViewData;
    onClose: () => void;
    onMoved: (message: string) => void;
    task: TaskViewData;
}) {
    const [projectId, setProjectId] = useState<string>(task.taskProjectId?.toString() ?? '');
    const [position, setPosition] = useState(task.position);
    const [processing, setProcessing] = useState(false);
    const projects = [...explorer.rootProjects, ...explorer.folders.flatMap((folder) => folder.projects)];
    const destinationCount = projectId === ''
        ? explorer.inboxCount
        : projects.find((project) => project.id === Number(projectId))?.openTaskCount ?? 0;
    const sameDestination = (task.taskProjectId?.toString() ?? '') === projectId;
    const availablePositions = Math.max(1, destinationCount + (sameDestination ? 0 : 1));
    const positions = useMemo(() => Array.from({ length: availablePositions }, (_, index) => index), [availablePositions]);

    function moveTask() {
        setProcessing(true);
        router.put(`/tasks/${task.id}/move`, {
            task_project_id: projectId === '' ? null : Number(projectId),
            position: Math.min(position, availablePositions - 1),
        }, {
            preserveScroll: true,
            onSuccess: () => {
                onMoved(`${task.title} moved.`);
                onClose();
            },
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <Dialog onClose={onClose} open title={`Move ${task.title}`}>
            <div className="space-y-4">
                <SelectField label="Destination" onChange={(event) => {
                    setProjectId(event.target.value);
                    setPosition(0);
                }} value={projectId}>
                    <option value="">Inbox</option>
                    {explorer.rootProjects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                    {explorer.folders.map((folder) => (
                        <optgroup key={folder.id} label={folder.name}>
                            {folder.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                        </optgroup>
                    ))}
                </SelectField>
                <SelectField label="Position" onChange={(event) => setPosition(Number(event.target.value))} value={Math.min(position, availablePositions - 1)}>
                    {positions.map((index) => <option key={index} value={index}>{index + 1}</option>)}
                </SelectField>
                <div className="flex gap-2 pt-2">
                    <Button fullWidth onClick={onClose} variant="secondary">Cancel</Button>
                    <Button disabled={processing} fullWidth onClick={moveTask}>{processing ? 'Moving…' : 'Move'}</Button>
                </div>
            </div>
        </Dialog>
    );
}
