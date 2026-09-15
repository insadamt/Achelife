import { router } from '@inertiajs/react';

import { TaskRow } from './TaskRow';
import type { TaskViewData } from './types';

export function TaskList({ emptyMessage, onAnnounce, onCompleted, onOpen, projectId, reorderable, showState = false, tasks }: {
    emptyMessage: string;
    onAnnounce: (message: string) => void;
    onCompleted: (task: TaskViewData) => void;
    onOpen: (taskId: number) => void;
    projectId: number | null;
    reorderable: boolean;
    showState?: boolean;
    tasks: TaskViewData[];
}) {
    function reorderTask(draggedTaskId: number, position: number) {
        const draggedTask = tasks.find((task) => task.id === draggedTaskId);
        if (!draggedTask || draggedTask.position === position) return;
        router.put(`/tasks/${draggedTaskId}/move`, { task_project_id: projectId, position }, {
            preserveScroll: true,
            onSuccess: () => onAnnounce(`${draggedTask.title} reordered.`),
        });
    }

    if (tasks.length === 0) {
        return <p className="py-12 text-center text-sm text-muted">{emptyMessage}</p>;
    }

    return (
        <div className="space-y-2">
            {tasks.map((task) => (
                <TaskRow
                    key={task.id}
                    onCompleted={onCompleted}
                    onDropTask={reorderTask}
                    onOpen={() => onOpen(task.id)}
                    reorderable={reorderable}
                    showState={showState}
                    task={task}
                />
            ))}
        </div>
    );
}
