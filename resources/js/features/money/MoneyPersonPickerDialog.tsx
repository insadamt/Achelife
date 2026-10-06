import { Check, Plus, Search, UserRound, X } from 'lucide-react';
import { useState } from 'react';

import { Button, Dialog, DialogDismissButton, Field } from '../../components/ui';
import { classNames } from '../../components/ui/classNames';
import type { MoneyPersonData } from './types';

export function MoneyPersonPickerDialog({ people, personId, personName, onClose, onSelect }: {
    people: MoneyPersonData[];
    personId: number | '';
    personName: string;
    onClose: () => void;
    onSelect: (personId: number | '', personName: string) => void;
}) {
    const [query, setQuery] = useState('');
    const [creating, setCreating] = useState(false);
    const [newPersonName, setNewPersonName] = useState(personName);
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const matchingPeople = people.filter((person) => `${person.name} ${person.nickname ?? ''}`.toLocaleLowerCase().includes(normalizedQuery));

    return (
        <Dialog description="Search or browse People, or add a new Person with this transaction." onClose={onClose} open title="Choose Person">
            {creating ? <div className="space-y-4">
                <Field autoFocus label="New Person name" maxLength={120} onChange={(event) => setNewPersonName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); if (newPersonName.trim()) onSelect('', newPersonName.trim()); } }} value={newPersonName} />
                <p className="text-sm text-muted">This Person will be created when you save the transaction.</p>
                <Button disabled={!newPersonName.trim()} fullWidth onClick={() => onSelect('', newPersonName.trim())}>Use new Person</Button>
                <Button fullWidth onClick={() => setCreating(false)} variant="ghost">Choose an existing Person</Button>
            </div> : <>
                <label className="relative block">
                    <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" size={17} />
                    <span className="sr-only">Search People</span>
                    <input autoFocus className="focus-ring min-h-12 w-full rounded-2xl border border-border-strong bg-app pr-4 pl-11 text-sm text-foreground placeholder:text-muted" onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') event.preventDefault(); }} placeholder="Search names or nicknames" value={query} />
                </label>
                <div className="mt-4 grid max-h-[min(60vh,28rem)] grid-cols-2 gap-2 overflow-y-auto pr-1">
                    <button aria-pressed={personId === '' && personName === ''} className={classNames('focus-ring col-span-2 flex min-h-14 items-center justify-between rounded-2xl border px-4 text-left text-sm font-bold', personId === '' && personName === '' ? 'border-[var(--money-accent)] bg-[color-mix(in_srgb,var(--money-accent)_10%,transparent)]' : 'border-border-subtle bg-app hover:bg-surface-hover')} onClick={() => onSelect('', '')} type="button">
                        <span className="flex items-center gap-2"><X aria-hidden="true" size={16} />No Person</span>
                        {personId === '' && personName === '' && <Check aria-hidden="true" size={17} />}
                    </button>
                    {matchingPeople.map((person) => <button aria-pressed={person.id === personId} className={classNames('focus-ring flex min-h-20 items-center gap-3 rounded-2xl border bg-app p-3 text-left hover:bg-surface-hover', person.id === personId ? 'border-[var(--money-accent)]' : 'border-border-subtle')} key={person.id} onClick={() => onSelect(person.id, '')} type="button">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--money-accent)_12%,transparent)] text-accent-ink"><UserRound aria-hidden="true" size={19} /></span>
                        <span className="min-w-0 flex-1"><span className="block break-words text-sm font-bold">{person.name}</span>{person.nickname && <span className="mt-0.5 block break-words text-xs text-muted">{person.nickname}</span>}{person.archivedAt && <span className="mt-0.5 block text-xs text-muted">Archived</span>}</span>
                        {person.id === personId && <Check aria-hidden="true" className="shrink-0" size={16} />}
                    </button>)}
                </div>
                {matchingPeople.length === 0 && <p className="mt-5 rounded-2xl border border-dashed border-border-strong bg-inset p-5 text-center text-sm text-muted">No matching People.</p>}
                <Button className="mt-4" fullWidth onClick={() => { setNewPersonName(personName || query.trim()); setCreating(true); }} variant="secondary"><Plus aria-hidden="true" size={17} />Add a new Person</Button>
            </>}
            <DialogDismissButton className="mt-5" fullWidth variant="ghost">Cancel</DialogDismissButton>
        </Dialog>
    );
}
