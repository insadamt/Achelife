import { Check, ChevronLeft } from 'lucide-react';
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
    const [confirmingClear, setConfirmingClear] = useState(false);

    function closeMoodDialog() {
        setConfirmingClear(false);
        onClose();
    }

    return (
        <Dialog description="Choose a feeling family, then the word that fits this day." onClose={closeMoodDialog} open={open} title="How did this day feel?">
            {confirmingClear ? (
                <div className="rounded-2xl border border-warning/35 bg-warning/8 p-4">
                    <p className="font-bold">Clear {selectedMood ? titleCase(selectedMood) : 'this mood'}?</p>
                    <p className="mt-1 text-sm leading-6 text-secondary">This day will become incomplete and its Diary SP will be recalculated.</p>
                    <div className="mt-5 flex gap-2">
                        <Button fullWidth onClick={() => setConfirmingClear(false)} variant="secondary">Keep mood</Button>
                        <Button fullWidth onClick={() => { onSelect(null, null); setActiveGroup(null); closeMoodDialog(); }} variant="ghost">Clear mood</Button>
                    </div>
                </div>
            ) : activeGroup === null ? (
                <div className="mood-family-grid grid grid-cols-2 gap-2">
                    {Object.keys(catalog).map((group) => (
                        <button
                            aria-pressed={selectedGroup === group}
                            className="focus-ring flex min-h-20 items-center justify-between rounded-2xl border border-border-subtle bg-surface px-4 text-left font-bold hover:border-border-strong hover:bg-surface-hover"
                            key={group}
                            onClick={() => setActiveGroup(group)}
                            type="button"
                        >
                            <span className="flex items-center gap-3"><span className="size-3 rounded-full" style={{ backgroundColor: groupColors[group] }} />{titleCase(group)}</span>
                            {selectedGroup === group && <Check aria-label="Selected family" className="text-success" size={18} />}
                        </button>
                    ))}
                </div>
            ) : (
                <div>
                    <button className="focus-ring mb-4 inline-flex items-center gap-1 text-sm font-bold text-secondary hover:text-foreground" onClick={() => setActiveGroup(null)} type="button"><ChevronLeft aria-hidden="true" size={16} />All families</button>
                    <div className="mb-4 flex items-center gap-2"><span className="size-3 rounded-full" style={{ backgroundColor: groupColors[activeGroup] }} /><h3 className="text-lg font-bold">{titleCase(activeGroup)}</h3></div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {(catalog[activeGroup] ?? []).map((mood) => (
                            <button
                                aria-pressed={selectedMood === mood}
                                className={`focus-ring min-h-16 rounded-2xl border px-3 font-semibold ${selectedMood === mood ? 'border-success/55 bg-success/10 text-success' : 'border-border-strong bg-surface hover:bg-surface-hover'}`}
                                key={mood}
                                onClick={() => { onSelect(activeGroup, mood); closeMoodDialog(); }}
                                type="button"
                            >
                                {titleCase(mood)}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            {!confirmingClear && selectedMood && <Button className="mt-5" fullWidth onClick={() => setConfirmingClear(true)} variant="ghost">Clear mood</Button>}
        </Dialog>
    );
}
