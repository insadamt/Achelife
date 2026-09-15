import { Check, ChevronDown, ChevronUp, GripVertical, ListPlus, Plus, Trash2 } from 'lucide-react';
import { useId, useRef, useState } from 'react';

import { Button } from '../../components/ui';
import { classNames } from '../../components/ui/classNames';
import type { EditableSubtask } from './types';

interface SubtaskEditorProps {
    subtasks: EditableSubtask[];
    onChange: (subtasks: EditableSubtask[]) => void;
    onToggleCompletion?: (subtask: EditableSubtask, index: number) => void;
    error?: string;
}

export function SubtaskEditor({ subtasks, onChange, onToggleCompletion, error }: SubtaskEditorProps) {
    const [draftTitle, setDraftTitle] = useState('');
    const [draftError, setDraftError] = useState<string | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dropIndex, setDropIndex] = useState<number | null>(null);
    const addInputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLOListElement>(null);
    const addInputId = useId();
    const draftErrorId = `${addInputId}-error`;
    const completedCount = subtasks.filter((subtask) => subtask.completed).length;

    function updateTitle(index: number, title: string) {
        onChange(subtasks.map((subtask, subtaskIndex) => (subtaskIndex === index ? { ...subtask, title } : subtask)));
    }

    function addTitles(titles: string[]) {
        const normalizedTitles = titles.map((title) => title.trim()).filter(Boolean);

        if (normalizedTitles.some((title) => title.length > 255)) {
            setDraftError('Each subtask must be 255 characters or fewer.');
            return;
        }

        const newSubtasks = normalizedTitles.map((title) => ({ title }));

        if (newSubtasks.length === 0) return;

        onChange([...subtasks, ...newSubtasks]);
        setDraftTitle('');
        setDraftError(null);
        window.requestAnimationFrame(() => {
            const subtaskList = listRef.current;
            subtaskList?.scrollTo({ top: subtaskList.scrollHeight, behavior: newSubtasks.length === 1 ? 'smooth' : 'auto' });
            addInputRef.current?.focus();
        });
    }

    function moveTo(index: number, targetIndex: number) {
        if (index === targetIndex || targetIndex < 0 || targetIndex >= subtasks.length) return;
        const reordered = [...subtasks];
        const [currentSubtask] = reordered.splice(index, 1);
        if (!currentSubtask) return;
        reordered.splice(targetIndex, 0, currentSubtask);
        onChange(reordered);
    }

    return (
        <div>
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-bold text-foreground">Checklist</p>
                    <p aria-live="polite" className="mt-0.5 text-xs text-muted">
                        {onToggleCompletion && subtasks.length > 0
                            ? `${completedCount} of ${subtasks.length} completed`
                            : `${subtasks.length} ${subtasks.length === 1 ? 'item' : 'items'}`}
                    </p>
                </div>
                {onToggleCompletion && subtasks.length > 0 && (
                    <span className="rounded-full bg-[color-mix(in_srgb,var(--module-accent)_14%,transparent)] px-3 py-1 text-xs font-bold text-accent-ink">
                        {Math.round((completedCount / subtasks.length) * 100)}%
                    </span>
                )}
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-border-strong bg-app p-2 focus-within:border-[var(--module-accent)] focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--module-accent)_18%,transparent)]">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--module-accent)_12%,transparent)] text-accent-ink">
                    <ListPlus aria-hidden="true" size={18} />
                </span>
                <label className="sr-only" htmlFor={addInputId}>Add a subtask</label>
                <input
                    autoComplete="off"
                    autoFocus
                    aria-describedby={draftError ? draftErrorId : undefined}
                    aria-invalid={Boolean(draftError)}
                    className="min-h-10 min-w-0 flex-1 bg-transparent px-1 text-sm font-semibold text-foreground outline-none placeholder:text-muted"
                    data-dialog-autofocus="true"
                    id={addInputId}
                    maxLength={255}
                    onChange={(event) => {
                        setDraftTitle(event.target.value);
                        setDraftError(null);
                    }}
                    onKeyDown={(event) => {
                        if (event.key !== 'Enter') return;
                        event.preventDefault();
                        addTitles([draftTitle]);
                    }}
                    onPaste={(event) => {
                        const pastedTitles = event.clipboardData.getData('text').split(/\r?\n/);
                        if (pastedTitles.length < 2) return;
                        event.preventDefault();
                        addTitles(pastedTitles);
                    }}
                    placeholder="Add a subtask and press Enter"
                    ref={addInputRef}
                    value={draftTitle}
                />
                <Button aria-label="Add subtask" className="size-10 shrink-0 px-0" disabled={!draftTitle.trim()} onClick={() => addTitles([draftTitle])} size="small">
                    <Plus aria-hidden="true" size={18} />
                </Button>
            </div>
            {draftError && <p className="mt-2 px-1 text-sm font-semibold text-danger" id={draftErrorId} role="alert">{draftError}</p>}
            <p className="mt-2 px-1 text-xs text-muted">Tip: paste a list with one subtask per line to add everything at once.</p>

            {subtasks.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-border-strong px-5 py-8 text-center">
                    <ListPlus aria-hidden="true" className="mx-auto text-muted" size={25} />
                    <p className="mt-3 text-sm font-bold text-foreground">Break this Task into clear steps</p>
                    <p className="mt-1 text-sm text-muted">Add the first step above, or paste an entire checklist.</p>
                </div>
            ) : (
                <ol className="mt-5 max-h-[min(24rem,48dvh)] space-y-2 overflow-y-auto pr-1" aria-label="Subtasks" ref={listRef}>
                    {subtasks.map((subtask, index) => (
                        <li
                            className={classNames(
                                'group flex items-center gap-2 rounded-2xl border bg-elevated p-2 transition-[border-color,background-color,opacity]',
                                dropIndex === index ? 'border-[var(--module-accent)] bg-surface-hover' : 'border-border-subtle',
                                draggedIndex === index && 'opacity-45',
                            )}
                            key={subtask.id ?? `new-${index}`}
                            onDragOver={(event) => {
                                if (draggedIndex === null) return;
                                event.preventDefault();
                                setDropIndex(index);
                            }}
                            onDrop={(event) => {
                                event.preventDefault();
                                if (draggedIndex !== null) moveTo(draggedIndex, index);
                                setDraggedIndex(null);
                                setDropIndex(null);
                            }}
                        >
                            <button
                                aria-label={`Drag subtask ${index + 1} to reorder`}
                                className="focus-ring hidden size-9 shrink-0 cursor-grab place-items-center rounded-xl text-muted hover:bg-surface-hover hover:text-foreground sm:grid"
                                draggable
                                onDragEnd={() => {
                                    setDraggedIndex(null);
                                    setDropIndex(null);
                                }}
                                onDragStart={(event) => {
                                    event.dataTransfer.effectAllowed = 'move';
                                    setDraggedIndex(index);
                                }}
                                type="button"
                            >
                                <GripVertical aria-hidden="true" size={17} />
                            </button>
                            {onToggleCompletion && subtask.id ? (
                                <label className="grid size-9 shrink-0 cursor-pointer place-items-center">
                                    <span className="sr-only">Mark {subtask.title || `subtask ${index + 1}`} {subtask.completed ? 'incomplete' : 'complete'}</span>
                                    <input
                                        checked={Boolean(subtask.completed)}
                                        className="peer sr-only"
                                        onChange={() => onToggleCompletion(subtask, index)}
                                        type="checkbox"
                                    />
                                    <span className="grid size-6 place-items-center rounded-full border-2 border-border-strong text-transparent transition-colors peer-checked:border-[var(--module-accent)] peer-checked:bg-[var(--module-accent)] peer-checked:text-accent-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--module-accent)] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-elevated">
                                        <Check aria-hidden="true" size={14} strokeWidth={3} />
                                    </span>
                                </label>
                            ) : (
                                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-hover text-xs font-bold text-muted">{index + 1}</span>
                            )}
                            <input
                                aria-label={`Subtask ${index + 1} title`}
                                className={classNames(
                                    'focus-ring min-h-10 min-w-0 flex-1 rounded-xl border border-transparent bg-transparent px-2 text-sm font-semibold text-foreground placeholder:text-muted hover:border-border-subtle focus:border-border-strong focus:bg-app',
                                    subtask.completed && 'text-muted line-through',
                                )}
                                maxLength={255}
                                onChange={(event) => updateTitle(index, event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault();
                                        addInputRef.current?.focus();
                                    }
                                }}
                                placeholder="Describe this step"
                                value={subtask.title}
                            />
                            <div className="flex shrink-0 items-center">
                                <button aria-label={`Move subtask ${index + 1} up`} className="focus-ring grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-hover hover:text-foreground disabled:opacity-25" disabled={index === 0} onClick={() => moveTo(index, index - 1)} type="button"><ChevronUp aria-hidden="true" size={16} /></button>
                                <button aria-label={`Move subtask ${index + 1} down`} className="focus-ring grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-hover hover:text-foreground disabled:opacity-25" disabled={index === subtasks.length - 1} onClick={() => moveTo(index, index + 1)} type="button"><ChevronDown aria-hidden="true" size={16} /></button>
                                <button aria-label={`Remove subtask ${index + 1}`} className="focus-ring grid size-8 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger" onClick={() => onChange(subtasks.filter((_, subtaskIndex) => subtaskIndex !== index))} type="button"><Trash2 aria-hidden="true" size={15} /></button>
                            </div>
                        </li>
                    ))}
                </ol>
            )}

            {error && <p className="mt-3 text-sm font-semibold text-danger" role="alert">{error}</p>}
        </div>
    );
}
