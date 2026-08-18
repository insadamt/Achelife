import { useState } from 'react';

import { Button, Dialog } from '../../components/ui';
import { titleCase } from './diaryPresentation';
import type { MoodCatalog } from './types';

interface MoodWheelDialogProps {
    catalog: MoodCatalog;
    open: boolean;
    selectedGroup: string | null;
    selectedMood: string | null;
    onClose: () => void;
    onSelect: (group: string | null, mood: string | null) => void;
}

const groupColors: Record<string, string> = {
    happy: '#f4c95d', calm: '#79c8c8', energetic: '#e69755', sad: '#6e8fc7',
    angry: '#d86a6a', anxious: '#aa82ce', tired: '#89929e', confused: '#85ad77',
};

export function MoodWheelDialog({ catalog, open, selectedGroup, selectedMood, onClose, onSelect }: MoodWheelDialogProps) {
    const [activeGroup, setActiveGroup] = useState<string | null>(selectedGroup);

    return (
        <Dialog description="Choose a broad family, then the word that fits." onClose={onClose} open={open} title="Mood wheel">
            {activeGroup === null ? (
                <div className="mood-wheel mx-auto grid aspect-square max-w-sm grid-cols-2 gap-2 rounded-full border border-border-subtle p-5 sm:grid-cols-4">
                    {Object.keys(catalog).map((group) => (
                        <button
                            className="focus-ring rounded-full border px-2 text-xs font-bold tracking-wide uppercase transition-transform hover:scale-105"
                            key={group}
                            onClick={() => setActiveGroup(group)}
                            style={{ borderColor: groupColors[group], color: groupColors[group] }}
                            type="button"
                        >
                            {group}
                        </button>
                    ))}
                </div>
            ) : (
                <div>
                    <button className="focus-ring mb-4 text-sm font-bold text-secondary hover:text-foreground" onClick={() => setActiveGroup(null)} type="button">← All families</button>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {(catalog[activeGroup] ?? []).map((mood) => (
                            <button
                                aria-pressed={selectedMood === mood}
                                className="focus-ring min-h-16 rounded-2xl border border-border-strong bg-surface px-3 font-semibold hover:bg-surface-hover"
                                key={mood}
                                onClick={() => { onSelect(activeGroup, mood); onClose(); }}
                                type="button"
                            >
                                {titleCase(mood)}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            <Button className="mt-5" fullWidth onClick={() => { onSelect(null, null); onClose(); }} variant="ghost">
                Clear mood · day becomes unresolved
            </Button>
        </Dialog>
    );
}
