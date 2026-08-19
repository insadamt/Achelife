import { Button } from '../../components/ui';
import type { EditableSubtask } from './types';

interface SubtaskEditorProps {
    subtasks: EditableSubtask[];
    onChange: (subtasks: EditableSubtask[]) => void;
    onToggleCompletion?: (subtask: EditableSubtask, index: number) => void;
}

export function SubtaskEditor({ subtasks, onChange, onToggleCompletion }: SubtaskEditorProps) {
    function updateTitle(index: number, title: string) {
        onChange(subtasks.map((subtask, subtaskIndex) => (subtaskIndex === index ? { ...subtask, title } : subtask)));
    }

    function move(index: number, direction: -1 | 1) {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= subtasks.length) return;
        const reordered = [...subtasks];
        const currentSubtask = reordered[index];
        const targetSubtask = reordered[targetIndex];
        if (!currentSubtask || !targetSubtask) return;
        reordered[index] = targetSubtask;
        reordered[targetIndex] = currentSubtask;
        onChange(reordered);
    }

    return (
        <div className="space-y-2">
            {subtasks.map((subtask, index) => (
                <div className="flex items-center gap-2" key={subtask.id ?? `new-${index}`}>
                    {onToggleCompletion && subtask.id ? (
                        <input
                            aria-label={`Mark ${subtask.title || `subtask ${index + 1}`} ${subtask.completed ? 'incomplete' : 'complete'}`}
                            checked={Boolean(subtask.completed)}
                            className="size-5 shrink-0 accent-[var(--module-accent)]"
                            onChange={() => onToggleCompletion(subtask, index)}
                            type="checkbox"
                        />
                    ) : <span className="w-5 text-center text-xs font-bold text-muted">{index + 1}</span>}
                    <input
                        aria-label={`Subtask ${index + 1} title`}
                        className="focus-ring min-h-10 min-w-0 flex-1 rounded-xl border border-border-strong bg-app px-3 text-sm text-foreground placeholder:text-muted"
                        onChange={(event) => updateTitle(index, event.target.value)}
                        placeholder="Subtask title"
                        value={subtask.title}
                    />
                    <button aria-label="Move subtask up" className="focus-ring size-9 rounded-lg text-muted hover:bg-surface-hover hover:text-foreground disabled:opacity-30" disabled={index === 0} onClick={() => move(index, -1)} type="button">↑</button>
                    <button aria-label="Move subtask down" className="focus-ring size-9 rounded-lg text-muted hover:bg-surface-hover hover:text-foreground disabled:opacity-30" disabled={index === subtasks.length - 1} onClick={() => move(index, 1)} type="button">↓</button>
                    <button aria-label="Remove subtask" className="focus-ring size-9 rounded-lg text-muted hover:bg-danger/10 hover:text-danger" onClick={() => onChange(subtasks.filter((_, subtaskIndex) => subtaskIndex !== index))} type="button">×</button>
                </div>
            ))}
            <Button className="mt-3" disabled={subtasks.length >= 20} onClick={() => onChange([...subtasks, { title: '' }])} size="small" variant="secondary">
                + Add subtask
            </Button>
        </div>
    );
}
