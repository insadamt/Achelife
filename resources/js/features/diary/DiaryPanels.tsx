import { router } from '@inertiajs/react';
import { useState } from 'react';

import { Button, Dialog } from '../../components/ui';
import { formatDiaryDate, titleCase } from './diaryPresentation';
import type { DiaryLanguage, DiaryPerson, DiarySearchData, MoodCatalog } from './types';

type PanelName = 'search' | 'people' | 'settings' | null;

interface DiaryPanelsProps {
    active: PanelName;
    configuredLanguageCodes: string[];
    languages: DiaryLanguage[];
    moodCatalog: MoodCatalog;
    people: DiaryPerson[];
    search: DiarySearchData;
    selectedPersonId: number | null;
    onClose: () => void;
    onOpenPerson: (personId: number) => void;
}

export function DiaryPanels(props: DiaryPanelsProps) {
    return (
        <>
            <SearchPanel {...props} open={props.active === 'search'} />
            <PeoplePanel {...props} open={props.active === 'people'} />
            <SettingsPanel {...props} open={props.active === 'settings'} />
        </>
    );
}

function SearchPanel({ open, onClose, search, languages, people, moodCatalog }: DiaryPanelsProps & { open: boolean }) {
    const [query, setQuery] = useState(search.query);
    const [mood, setMood] = useState(search.mood ?? '');
    const [language, setLanguage] = useState(search.language ?? '');
    const [person, setPerson] = useState(search.person?.toString() ?? '');

    function runSearch() {
        router.get('/diary', { q: query || undefined, mood: mood || undefined, language: language || undefined, person: person || undefined }, { preserveState: true, preserveScroll: true, only: ['search'] });
    }

    return (
        <Dialog description="Search persisted autosaves by text, mood, language, or Person." onClose={onClose} open={open} placement="right" title="Search Diary">
            <div className="space-y-3">
                <input aria-label="Search text" className="focus-ring w-full rounded-xl border border-border-strong bg-surface px-4 py-3" onChange={(event) => setQuery(event.target.value)} placeholder="Words in your Diary" value={query} />
                <div className="grid grid-cols-2 gap-2">
                    <select aria-label="Mood filter" className="focus-ring rounded-xl border border-border-strong bg-surface px-3 py-3" onChange={(event) => setMood(event.target.value)} value={mood}>
                        <option value="">Any mood</option>{Object.values(moodCatalog).flat().map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}
                    </select>
                    <select aria-label="Language filter" className="focus-ring rounded-xl border border-border-strong bg-surface px-3 py-3" onChange={(event) => setLanguage(event.target.value)} value={language}>
                        <option value="">Any language</option>{languages.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
                    </select>
                </div>
                <select aria-label="Person filter" className="focus-ring w-full rounded-xl border border-border-strong bg-surface px-3 py-3" onChange={(event) => setPerson(event.target.value)} value={person}>
                    <option value="">Any Person</option>{people.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <Button fullWidth onClick={runSearch}>Search</Button>
            </div>
            <div className="mt-7 space-y-2">
                {search.results.map((result) => (
                    <button className="focus-ring w-full rounded-2xl border border-border-subtle bg-surface p-4 text-left hover:bg-surface-hover" key={result.date} onClick={() => router.get('/diary', { date: result.date })} type="button">
                        <span className="font-bold">{formatDiaryDate(result.date, { dateStyle: 'medium' })}</span>
                        <span className="ml-2 text-xs text-muted">{result.mood ? titleCase(result.mood) : 'No mood'} · {result.languageName ?? 'No language'}</span>
                        <span className="mt-2 block text-sm leading-5 text-secondary">“{result.excerpt}”</span>
                    </button>
                ))}
                {search.results.length === 0 && (search.query || search.mood || search.language || search.person) && <p className="py-8 text-center text-sm text-muted">No persisted entries match.</p>}
            </div>
        </Dialog>
    );
}

function PeoplePanel({ open, onClose, people, selectedPersonId, onOpenPerson }: DiaryPanelsProps & { open: boolean }) {
    const selectedPerson = people.find((person) => person.id === selectedPersonId) ?? null;

    function remove(person: DiaryPerson) {
        if (person.mentionCount > 0) router.post(`/diary/people/${person.id}/archive`, {}, { preserveScroll: true });
        else router.delete(`/diary/people/${person.id}`, { preserveScroll: true });
    }

    return (
        <Dialog description="People live inside Diary and keep historical mention links intact." onClose={onClose} open={open} placement="right" title={selectedPerson ? selectedPerson.name : 'People'}>
            {selectedPerson ? (
                <PersonProfile onBack={() => onOpenPerson(0)} onRemove={() => remove(selectedPerson)} person={selectedPerson} />
            ) : (
                <div className="space-y-2">
                    {people.map((person) => <button className="focus-ring flex w-full items-center justify-between rounded-xl border border-border-subtle p-3 text-left hover:bg-surface-hover" key={person.id} onClick={() => onOpenPerson(person.id)} type="button"><span><span className="font-bold">{person.name}</span>{person.nickname && <span className="ml-2 text-sm text-muted">{person.nickname}</span>}</span><span className="text-xs text-muted">{person.archived ? 'Archived' : `${person.mentionCount} entries`}</span></button>)}
                    {people.length === 0 && <p className="py-10 text-center text-sm text-muted">Type @ in an entry to create your first Person.</p>}
                </div>
            )}
        </Dialog>
    );
}

function PersonProfile({ person, onBack, onRemove }: { person: DiaryPerson; onBack: () => void; onRemove: () => void }) {
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(person.name);
    const [nickname, setNickname] = useState(person.nickname ?? '');
    const [note, setNote] = useState(person.note ?? '');

    function updatePerson() {
        router.put(`/diary/people/${person.id}`, { name, nickname: nickname || null, note: note || null }, { preserveScroll: true, onSuccess: () => setEditing(false) });
    }

    return (
        <div>
            <div className="flex items-center justify-between gap-3">
                <button className="focus-ring text-sm font-bold text-secondary" onClick={onBack} type="button">← All People</button>
                {!person.archived && <button className="focus-ring text-sm font-bold text-[var(--diary-accent)]" onClick={() => setEditing((value) => !value)} type="button">{editing ? 'Cancel' : 'Edit'}</button>}
            </div>
            {editing ? (
                <div className="mt-5 space-y-3">
                    <label className="block text-sm font-semibold">Name<input className="focus-ring mt-1 w-full rounded-xl border border-border-strong bg-surface px-4 py-3" onChange={(event) => setName(event.target.value)} value={name} /></label>
                    <label className="block text-sm font-semibold">Nickname<input className="focus-ring mt-1 w-full rounded-xl border border-border-strong bg-surface px-4 py-3" onChange={(event) => setNickname(event.target.value)} value={nickname} /></label>
                    <label className="block text-sm font-semibold">Note<textarea className="focus-ring mt-1 min-h-28 w-full rounded-xl border border-border-strong bg-surface px-4 py-3" onChange={(event) => setNote(event.target.value)} value={note} /></label>
                    <Button disabled={!name.trim()} fullWidth onClick={updatePerson}>Update Person</Button>
                </div>
            ) : (
                <>
                    {person.nickname && <p className="mt-5 text-lg text-secondary">“{person.nickname}”</p>}
                    {person.note && <p className="mt-3 whitespace-pre-wrap leading-6">{person.note}</p>}
                </>
            )}
            <p className="mt-6 font-bold">Mentioned in {person.mentionCount} {person.mentionCount === 1 ? 'entry' : 'entries'}</p>
            <div className="mt-3 space-y-2">
                {person.recentEntries.map((entry) => <button className="focus-ring w-full rounded-xl border border-border-subtle p-3 text-left hover:bg-surface-hover" key={entry.date} onClick={() => router.get('/diary', { date: entry.date })} type="button"><span className="font-bold">{formatDiaryDate(entry.date)}</span><span className="mt-1 block text-xs text-muted">{entry.excerpt}</span></button>)}
            </div>
            {!person.archived && <Button className="mt-6" onClick={onRemove} variant="secondary">{person.mentionCount > 0 ? 'Archive Person' : 'Delete Person'}</Button>}
            {person.archived && <p className="mt-6 text-sm font-semibold text-muted">Archived · historical profile remains readable.</p>}
        </div>
    );
}

function SettingsPanel({ open, onClose, configuredLanguageCodes, languages }: DiaryPanelsProps & { open: boolean }) {
    const [selected, setSelected] = useState(configuredLanguageCodes);

    function toggle(code: string) {
        setSelected((current) => current.includes(code) ? current.filter((item) => item !== code) : [...current, code]);
    }

    return (
        <Dialog description="Removing a language only changes the selector. Existing entries retain their stored language." onClose={onClose} open={open} placement="right" title="Diary languages">
            <div className="space-y-2">
                {languages.map((language) => <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border-subtle p-3 hover:bg-surface-hover" key={language.code}><span><span className="font-semibold">{language.name}</span><span className="ml-2 text-xs text-muted">{language.code.toUpperCase()} · {language.direction.toUpperCase()}</span></span><input checked={selected.includes(language.code)} onChange={() => toggle(language.code)} type="checkbox" /></label>)}
            </div>
            <Button className="mt-6" fullWidth onClick={() => router.put('/diary/settings/languages', { languages: selected }, { preserveScroll: true, onSuccess: onClose })}>Update selector</Button>
        </Dialog>
    );
}
