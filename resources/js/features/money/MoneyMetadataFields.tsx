import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import type { KeyboardEvent } from 'react';

import { Button } from '../../components/ui';
import type { MoneyTagData } from './types';

export function MoneyMetadataFields({
    onTagsChange,
    tagError,
    tags,
    value,
}: {
    onTagsChange: (tags: string[]) => void;
    tagError?: string;
    tags: MoneyTagData[];
    value: string[];
}) {
    const [tagInput, setTagInput] = useState('');
    const selectedNames = new Set(value.map((name) => name.toLocaleLowerCase()));
    const suggestions = tags.filter((tag) => tag.archivedAt == null && !selectedNames.has(tag.name.toLocaleLowerCase()));

    function addTag(rawName: string) {
        const name = rawName.trim().replace(/\s+/g, ' ');
        if (!name || selectedNames.has(name.toLocaleLowerCase()) || value.length >= 10) return;

        onTagsChange([...value, name]);
        setTagInput('');
    }

    function handleTagKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            addTag(tagInput);
        }
    }

    function removeTag(name: string) {
        onTagsChange(value.filter((tag) => tag !== name));
    }

    return (
        <div className="space-y-5">
            <div>
                <label className="text-sm font-semibold text-secondary" htmlFor="money-tag-input">Tags (optional)</label>
                {value.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {value.map((name) => {
                            const existing = tags.find((tag) => tag.name.toLocaleLowerCase() === name.toLocaleLowerCase());

                            return (
                                <span className="inline-flex min-h-8 items-center gap-1 rounded-full border border-border-subtle bg-elevated px-3 text-xs font-bold" key={name} style={existing?.color ? { borderColor: `${existing.color}66`, color: existing.color } : undefined}>
                                    {name}
                                    <button aria-label={`Remove ${name}`} className="focus-ring rounded-full p-0.5" onClick={() => removeTag(name)} type="button"><X aria-hidden="true" size={12} /></button>
                                </span>
                            );
                        })}
                    </div>
                )}
                <div className="mt-2 flex gap-2">
                    <input
                        className="focus-ring min-h-11 min-w-0 flex-1 rounded-2xl border border-border-strong bg-app px-4 text-foreground"
                        id="money-tag-input"
                        maxLength={50}
                        onChange={(event) => setTagInput(event.target.value)}
                        onKeyDown={handleTagKeyDown}
                        placeholder="Type a Tag and press Enter"
                        value={tagInput}
                    />
                    <Button disabled={!tagInput.trim() || value.length >= 10} onClick={() => addTag(tagInput)} size="small" type="button" variant="secondary"><Plus aria-hidden="true" size={15} />Add</Button>
                </div>
                {suggestions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {suggestions.slice(0, 8).map((tag) => (
                            <button className="focus-ring rounded-full border border-border-subtle px-2.5 py-1 text-xs font-semibold text-muted hover:text-foreground" key={tag.id} onMouseDown={(event) => event.preventDefault()} onClick={() => addTag(tag.name)} type="button">+ {tag.name}</button>
                        ))}
                    </div>
                )}
                {tagError && <p className="mt-2 text-sm text-danger">{tagError}</p>}
                <p className="mt-2 text-xs text-muted">Use up to 10 Tags for dimensions that cross Categories.</p>
            </div>
        </div>
    );
}
