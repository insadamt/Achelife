import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import { Button, Dialog, SelectField } from '../../components/ui';
import type { TaskExplorerViewData, TaskProjectViewData } from './types';

export function TaskProjectMoveDialog({ explorer, folderId, onClose, onMoved, project }: {
    explorer: TaskExplorerViewData;
    folderId: number | null;
    onClose: () => void;
    onMoved: (message: string) => void;
    project: TaskProjectViewData;
}) {
    const [destinationFolderId, setDestinationFolderId] = useState(folderId?.toString() ?? '');
    const [position, setPosition] = useState(project.position);
    const [processing, setProcessing] = useState(false);
    const destinationProjects = destinationFolderId === ''
        ? explorer.rootProjects
        : explorer.folders.find((folder) => folder.id === Number(destinationFolderId))?.projects ?? [];
    const sameDestination = (folderId?.toString() ?? '') === destinationFolderId;
    const availablePositions = Math.max(1, destinationProjects.length + (sameDestination ? 0 : 1));
    const positions = useMemo(() => Array.from({ length: availablePositions }, (_, index) => index), [availablePositions]);

    function moveProject() {
        setProcessing(true);
        router.put(`/task-projects/${project.id}/move`, {
            task_folder_id: destinationFolderId === '' ? null : Number(destinationFolderId),
            position: Math.min(position, availablePositions - 1),
        }, {
            preserveScroll: true,
            onSuccess: () => {
                onMoved(`${project.name} moved.`);
                onClose();
            },
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <Dialog onClose={onClose} open title={`Move ${project.name}`}>
            <div className="space-y-4">
                <SelectField label="Folder" onChange={(event) => {
                    setDestinationFolderId(event.target.value);
                    setPosition(0);
                }} value={destinationFolderId}>
                    <option value="">Root Projects</option>
                    {explorer.folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
                </SelectField>
                <SelectField label="Position" onChange={(event) => setPosition(Number(event.target.value))} value={Math.min(position, availablePositions - 1)}>
                    {positions.map((index) => <option key={index} value={index}>{index + 1}</option>)}
                </SelectField>
                <div className="flex gap-2 pt-2">
                    <Button fullWidth onClick={onClose} variant="secondary">Cancel</Button>
                    <Button disabled={processing} fullWidth onClick={moveProject}>{processing ? 'Moving…' : 'Move'}</Button>
                </div>
            </div>
        </Dialog>
    );
}
