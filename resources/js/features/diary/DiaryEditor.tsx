import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { Button, Dialog } from '../../components/ui';
import { contentToPlainText, formatDiaryDate, restoreMentionBoundarySpacing, titleCase } from './diaryPresentation';
import { MoodWheelDialog } from './MoodWheelDialog';
import { getTextareaCaretCoordinates } from './textareaCaret';
import type { DiaryContentNode, DiaryDay, DiaryLanguage, DiaryPerson, DiarySaveResult, DiarySaveState, MoodCatalog } from './types';

interface MentionBinding {
    personId: number;
    label: string;
    start: number;
    end: number;
}

interface DiaryEditorProps {
    day: DiaryDay;
    languages: DiaryLanguage[];
    moodCatalog: MoodCatalog;
    people: DiaryPerson[];
    onOpenPerson: (personId: number) => void;
    onSaved: (result: DiarySaveResult) => void;
    onSaveStateChange: (state: DiarySaveState) => void;
}

export interface DiaryEditorHandle {
    saveBeforeNavigation: () => Promise<boolean>;
}

function bindingsFromContent(nodes: DiaryContentNode[]) {
    const bindings: MentionBinding[] = [];
    let position = 0;

    nodes.forEach((node) => {
        const text = node.type === 'text' ? node.text : `@${node.label}`;
        if (node.type === 'mention') {
            bindings.push({ personId: node.personId, label: node.label, start: position, end: position + text.length });
        }
        position += text.length;
    });

    return bindings;
}

function contentFromText(text: string, bindings: MentionBinding[]): DiaryContentNode[] {
    const nodes: DiaryContentNode[] = [];
    let position = 0;

    bindings.sort((left, right) => left.start - right.start).forEach((binding) => {
        if (binding.start < position || text.slice(binding.start, binding.end) !== `@${binding.label}`) {
            return;
        }
        if (binding.start > position) {
            nodes.push({ type: 'text', text: text.slice(position, binding.start) });
        }
        nodes.push({ type: 'mention', personId: binding.personId, label: binding.label });
        position = binding.end;
    });
    if (position < text.length || nodes.length === 0) {
        nodes.push({ type: 'text', text: text.slice(position) });
    }

    return nodes;
}

function adjustedBindings(previous: string, next: string, bindings: MentionBinding[]) {
    let prefix = 0;
    while (prefix < previous.length && prefix < next.length && previous[prefix] === next[prefix]) prefix++;
    let suffix = 0;
    while (suffix < previous.length - prefix && suffix < next.length - prefix && previous[previous.length - 1 - suffix] === next[next.length - 1 - suffix]) suffix++;
    const oldEnd = previous.length - suffix;
    const delta = next.length - previous.length;

    return bindings.flatMap((binding) => {
        if (binding.end <= prefix) return [binding];
        if (binding.start >= oldEnd) return [{ ...binding, start: binding.start + delta, end: binding.end + delta }];
        return [];
    });
}

function MentionProfileButton({ label, personId, onOpen }: { label: string; personId: number; onOpen: (personId: number) => void }) {
    return (
        <button
            aria-label={`Open ${label}'s Person profile`}
            className="diary-mention focus-ring group pointer-events-auto relative rounded bg-[color-mix(in_srgb,var(--diary-accent)_16%,transparent)] text-[var(--diary-accent)]"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onOpen(personId)}
            type="button"
        >
            @{label}
            <span className="pointer-events-none absolute bottom-[calc(100%+0.4rem)] left-1/2 z-40 -translate-x-1/2 rounded-lg border border-border-strong bg-elevated px-2.5 py-1.5 text-[0.65rem] leading-none font-bold whitespace-nowrap text-foreground opacity-0 shadow-xl transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                See profile
            </span>
        </button>
    );
}

export const DiaryEditor = forwardRef<DiaryEditorHandle, DiaryEditorProps>(function DiaryEditor(
    { day, languages, moodCatalog, people, onOpenPerson, onSaved, onSaveStateChange },
    ref,
) {
    const restoredContent = useMemo(() => restoreMentionBoundarySpacing(day.content), [day.content]);
    const restoredPlainText = contentToPlainText(restoredContent);
    const [plainText, setPlainText] = useState(restoredPlainText);
    const [bindings, setBindings] = useState(() => bindingsFromContent(restoredContent));
    const [languageCode, setLanguageCode] = useState(day.languageCode ?? '');
    const [mood, setMood] = useState(day.mood);
    const [moodGroup, setMoodGroup] = useState(day.moodGroup);
    const [saveState, setSaveState] = useState<DiarySaveState>('idle');
    const [moodOpen, setMoodOpen] = useState(false);
    const [createName, setCreateName] = useState<string | null>(null);
    const [creatingPerson, setCreatingPerson] = useState(false);
    const [localPeople, setLocalPeople] = useState(people);
    const [cursor, setCursor] = useState(0);
    const [dismissedMentionCursor, setDismissedMentionCursor] = useState<number | null>(null);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const writingAreaRef = useRef<HTMLDivElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const revisionRef = useRef(day.clientRevision);
    const initializedRef = useRef(restoredPlainText !== day.plainText);
    const requestRef = useRef<AbortController | null>(null);
    const saveTimeoutRef = useRef<number | null>(null);
    const activeLanguages = languages;
    const cursorTouchesMention = bindings.some((binding) => cursor > binding.start && cursor <= binding.end);
    const nextCharacterContinuesName = /^[\p{L}\p{N}_'-]$/u.test(plainText[cursor] ?? '');
    const mentionMatch = cursorTouchesMention || nextCharacterContinuesName || dismissedMentionCursor === cursor
        ? null
        : plainText.slice(0, cursor).match(/@([\p{L}\p{N}_'-]*)$/u);
    const mentionQuery = mentionMatch?.[1]?.toLocaleLowerCase() ?? null;
    const mentionStart = mentionMatch ? cursor - mentionMatch[0].length : null;
    const suggestions = useMemo(
        () => mentionQuery === null ? [] : localPeople.filter((person) => !person.archived && person.name.toLocaleLowerCase().includes(mentionQuery)).slice(0, 6),
        [localPeople, mentionQuery],
    );
    const characterCount = Array.from(plainText.trim()).length;
    const hasEnoughCharacters = characterCount >= 20;
    const content = useMemo(() => contentFromText(plainText, [...bindings]), [bindings, plainText]);
    const currentSignature = useMemo(() => JSON.stringify({ content, languageCode, mood, moodGroup }), [content, languageCode, mood, moodGroup]);
    const initialPersistedSignature = useMemo(() => JSON.stringify({
        content: day.content,
        languageCode: day.languageCode ?? '',
        mood: day.mood,
        moodGroup: day.moodGroup,
    }), [day.content, day.languageCode, day.mood, day.moodGroup]);
    const latestSignatureRef = useRef(currentSignature);
    const lastPersistedSignatureRef = useRef(initialPersistedSignature);

    const updateSaveState = useCallback((state: DiarySaveState) => {
        setSaveState(state);
        onSaveStateChange(state);
    }, [onSaveStateChange]);

    const persistEntry = useCallback(async () => {
        if (!day.editable || currentSignature === lastPersistedSignatureRef.current) return true;

        if (saveTimeoutRef.current !== null) {
            window.clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
        }

        requestRef.current?.abort();
        const controller = new AbortController();
        requestRef.current = controller;
        const revision = ++revisionRef.current;
        const signatureBeingSaved = currentSignature;
        updateSaveState('saving');

        try {
            const response = await fetch(`/diary/entries/${day.date}`, {
                method: 'PUT',
                credentials: 'same-origin',
                signal: controller.signal,
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                },
                body: JSON.stringify({
                    content,
                    language_code: languageCode || null,
                    mood,
                    mood_group: moodGroup,
                    client_revision: revision,
                }),
            });
            if (!response.ok) throw new Error('Autosave failed');

            const result = await response.json();
            lastPersistedSignatureRef.current = signatureBeingSaved;
            if (signatureBeingSaved === latestSignatureRef.current) updateSaveState('saved');
            onSaved({
                date: result.entry.date,
                earnedSp: result.entry.earnedSp,
                seasonPoints: result.seasonPoints,
                state: result.entry.state,
                characterCount: result.entry.characterCount,
                languageCode: result.entry.languageCode,
                languageName: result.entry.languageName,
                mood: result.entry.mood,
                moodGroup: result.entry.moodGroup,
                streakAfter: result.entry.streakAfter,
                multiplier: result.entry.multiplier,
            });

            return true;
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') return false;
            updateSaveState('error');

            return false;
        }
    }, [content, currentSignature, day.date, day.editable, languageCode, mood, moodGroup, onSaved, updateSaveState]);

    useEffect(() => {
        if (!day.editable) return;
        if (!initializedRef.current) {
            initializedRef.current = true;
            return;
        }

        saveTimeoutRef.current = window.setTimeout(() => void persistEntry(), 700);

        return () => {
            if (saveTimeoutRef.current !== null) window.clearTimeout(saveTimeoutRef.current);
        };
    }, [currentSignature, day.editable, persistEntry]);

    useEffect(() => {
        latestSignatureRef.current = currentSignature;
    }, [currentSignature]);

    useImperativeHandle(ref, () => ({ saveBeforeNavigation: persistEntry }), [persistEntry]);

    useEffect(() => {
        function warnAboutUnsavedEntry(event: BeforeUnloadEvent) {
            if (latestSignatureRef.current === lastPersistedSignatureRef.current) return;
            event.preventDefault();
            event.returnValue = '';
        }

        window.addEventListener('beforeunload', warnAboutUnsavedEntry);

        return () => {
            requestRef.current?.abort();
            window.removeEventListener('beforeunload', warnAboutUnsavedEntry);
        };
    }, []);

    useLayoutEffect(() => {
        const textarea = textareaRef.current;

        if (textarea === null) return;

        textarea.style.height = 'auto';
        textarea.style.height = `${Math.max(window.innerHeight * 0.46, textarea.scrollHeight)}px`;
    }, [plainText]);

    useLayoutEffect(() => {
        const textarea = textareaRef.current;
        const writingArea = writingAreaRef.current;
        const suggestions = suggestionsRef.current;

        if (mentionQuery === null || textarea === null || writingArea === null || suggestions === null) return;

        const caret = getTextareaCaretCoordinates(textarea, cursor);
        const maximumLeft = Math.max(0, writingArea.clientWidth - Math.min(352, writingArea.clientWidth));
        const desiredLeft = activeLanguages.find((language) => language.code === languageCode)?.direction === 'rtl'
            ? caret.left - Math.min(352, writingArea.clientWidth)
            : caret.left;

        suggestions.style.left = `${Math.max(0, Math.min(desiredLeft, maximumLeft))}px`;
        suggestions.style.top = `${caret.top + caret.lineHeight + 8}px`;
    }, [activeLanguages, cursor, languageCode, mentionQuery, plainText]);

    function updateText(next: string, nextCursor: number) {
        setBindings((current) => adjustedBindings(plainText, next, current));
        setPlainText(next);
        setCursor(nextCursor);
        setDismissedMentionCursor(null);
        setActiveSuggestionIndex(0);
    }

    function insertMention(person: DiaryPerson) {
        if (mentionStart === null) return;
        const token = `@${person.name}`;
        const prefix = plainText.slice(0, mentionStart);
        const remainder = plainText.slice(cursor);
        const leadingSpace = prefix !== '' && !/[\s([{]$/u.test(prefix) ? ' ' : '';
        const trailingSpace = remainder === '' || !/^[\s.,!?;:)\]}]/u.test(remainder) ? ' ' : '';
        const bindingStart = prefix.length + leadingSpace.length;
        const next = prefix + leadingSpace + token + trailingSpace + remainder;
        const nextBindings = adjustedBindings(plainText, next, bindings);
        nextBindings.push({ personId: person.id, label: person.name, start: bindingStart, end: bindingStart + token.length });
        setPlainText(next);
        setBindings(nextBindings);
        const nextCursor = bindingStart + token.length + trailingSpace.length;
        setCursor(nextCursor);
        window.requestAnimationFrame(() => {
            textareaRef.current?.focus();
            textareaRef.current?.setSelectionRange(nextCursor, nextCursor);
        });
    }

    function handleEditorKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (mentionQuery === null) return;

        if (event.key === 'Escape') {
            event.preventDefault();
            setDismissedMentionCursor(cursor);
            return;
        }

        if (suggestions.length === 0) return;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveSuggestionIndex((current) => (current + 1) % suggestions.length);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveSuggestionIndex((current) => (current - 1 + suggestions.length) % suggestions.length);
        } else if (event.key === 'Enter') {
            event.preventDefault();
            insertMention(suggestions[activeSuggestionIndex]!);
        }
    }

    async function createPerson() {
        if (!createName?.trim()) return;
        setCreatingPerson(true);
        try {
            const response = await fetch('/diary/people', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                },
                body: JSON.stringify({ name: createName.trim(), nickname: null, note: null }),
            });
            if (!response.ok) throw new Error('Person creation failed');
            const result = await response.json();
            setLocalPeople((current) => [...current, result.person]);
            insertMention(result.person);
            setCreateName(null);
        } finally {
            setCreatingPerson(false);
        }
    }

    if (day.locked) {
        return (
            <section className="diary-writing-surface min-h-[58vh] px-5 py-8 sm:px-10 lg:px-14" dir={day.direction}>
                {restoredContent.map((node, index) => node.type === 'text' ? (
                    <span className="whitespace-pre-wrap" key={index}>{node.text}</span>
                ) : (
                    <MentionProfileButton key={index} label={node.label} onOpen={onOpenPerson} personId={node.personId} />
                ))}
                {!day.plainText && <p className="text-muted">No valid entry was recorded for this locked day.</p>}
            </section>
        );
    }

    return (
        <>
            <section className="relative min-h-[58vh] px-5 py-6 sm:px-10 lg:px-14">
                <div className="mb-5 flex flex-wrap items-center gap-2" dir="ltr">
                    <button className={`focus-ring rounded-full border px-4 py-2 text-sm font-semibold hover:bg-surface-hover ${hasEnoughCharacters && !mood ? 'border-warning text-warning' : 'border-border-strong'}`} onClick={() => setMoodOpen(true)} type="button">
                        {mood ? `Mood: ${titleCase(mood)}` : 'Choose mood'}
                    </button>
                    <label className={`rounded-full border px-3 py-2 text-sm font-semibold ${hasEnoughCharacters && !languageCode ? 'border-warning text-warning' : 'border-border-strong'}`}>
                        <span className="sr-only">Diary language</span>
                        <select className="bg-transparent text-foreground outline-none" onChange={(event) => setLanguageCode(event.target.value)} value={languageCode}>
                            <option className="bg-elevated" value="">Choose language</option>
                            {activeLanguages.map((language) => <option className="bg-elevated" key={language.code} value={language.code}>{language.name}</option>)}
                        </select>
                    </label>
                    {saveState === 'error' && <Button className="ml-auto" onClick={() => void persistEntry()} size="small" variant="ghost">Retry save</Button>}
                </div>
                <div className="relative" ref={writingAreaRef}>
                    <div className="diary-editor diary-editor-overlay pointer-events-none absolute inset-x-0 top-0 z-20 whitespace-pre-wrap text-xl leading-[1.9] text-foreground sm:text-2xl">
                        {content.map((node, index) => node.type === 'text' ? (
                            <span aria-hidden="true" key={index}>{node.text}</span>
                        ) : (
                            <MentionProfileButton key={index} label={node.label} onOpen={onOpenPerson} personId={node.personId} />
                        ))}
                    </div>
                    <textarea
                        aria-label={`Diary entry for ${formatDiaryDate(day.date)}`}
                        className="diary-editor relative z-10 min-h-[46vh] w-full resize-none overflow-hidden bg-transparent p-0 text-xl leading-[1.9] text-transparent caret-foreground outline-none placeholder:text-muted/65 sm:text-2xl"
                        dir={activeLanguages.find((language) => language.code === languageCode)?.direction ?? 'ltr'}
                        aria-activedescendant={mentionQuery !== null && suggestions.length > 0 ? `diary-person-suggestion-${suggestions[activeSuggestionIndex]!.id}` : undefined}
                        aria-autocomplete="list"
                        aria-controls={mentionQuery !== null ? 'diary-person-suggestions' : undefined}
                        aria-expanded={mentionQuery !== null}
                        onChange={(event) => updateText(event.target.value, event.target.selectionStart)}
                        onClick={(event) => { setCursor(event.currentTarget.selectionStart); setDismissedMentionCursor(null); setActiveSuggestionIndex(0); }}
                        onKeyDown={handleEditorKeyDown}
                        onKeyUp={(event) => setCursor(event.currentTarget.selectionStart)}
                        onSelect={(event) => { setCursor(event.currentTarget.selectionStart); setDismissedMentionCursor(null); setActiveSuggestionIndex(0); }}
                        placeholder="Start writing…"
                        ref={textareaRef}
                        spellCheck
                        value={plainText}
                    />
                    {mentionQuery !== null && (
                        <div className="absolute z-30 w-[min(22rem,100%)] rounded-2xl border border-border-strong bg-elevated p-2 shadow-2xl" id="diary-person-suggestions" ref={suggestionsRef} role="listbox">
                            {suggestions.map((person, index) => (
                                <button aria-selected={index === activeSuggestionIndex} className={`focus-ring flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left ${index === activeSuggestionIndex ? 'bg-surface-hover' : 'hover:bg-surface-hover'}`} id={`diary-person-suggestion-${person.id}`} key={person.id} onClick={() => insertMention(person)} role="option" type="button">
                                    <span className="font-semibold">@{person.name}</span><span className="text-xs text-muted">Person</span>
                                </button>
                            ))}
                            {mentionQuery !== '' && !suggestions.some((person) => person.name.toLocaleLowerCase() === mentionQuery) && (
                                <button className="focus-ring w-full rounded-xl px-3 py-2.5 text-left font-semibold text-[var(--diary-accent)] hover:bg-surface-hover" onClick={() => setCreateName(mentionMatch?.[1] ?? '')} type="button">+ Create “{mentionMatch?.[1]}”</button>
                            )}
                        </div>
                    )}
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border-subtle pt-4 text-xs font-semibold" dir="ltr">
                    <CompletionRequirement complete={hasEnoughCharacters} label={hasEnoughCharacters ? `${characterCount} characters` : `${20 - characterCount} more characters`} />
                    <CompletionRequirement complete={Boolean(mood)} label={mood ? titleCase(mood) : 'Choose mood'} />
                    <CompletionRequirement complete={Boolean(languageCode)} label={activeLanguages.find((language) => language.code === languageCode)?.name ?? 'Choose language'} />
                    {hasEnoughCharacters && mood && languageCode && <span className="ml-auto text-success">Ready to complete</span>}
                </div>
            </section>

            <MoodWheelDialog catalog={moodCatalog} onClose={() => setMoodOpen(false)} onSelect={(group, selectedMood) => { setMoodGroup(group); setMood(selectedMood); }} open={moodOpen} selectedGroup={moodGroup} selectedMood={mood} />
            <Dialog description="Create this Person and insert a stable mention without leaving your entry." onClose={() => setCreateName(null)} open={createName !== null} title="New Person">
                <label className="text-sm font-semibold">Name<input autoFocus className="focus-ring mt-2 w-full rounded-xl border border-border-strong bg-surface px-4 py-3" onChange={(event) => setCreateName(event.target.value)} value={createName ?? ''} /></label>
                <Button className="mt-5" disabled={creatingPerson || !createName?.trim()} fullWidth onClick={createPerson}>{creatingPerson ? 'Creating…' : 'Create and mention'}</Button>
            </Dialog>
        </>
    );
});

function CompletionRequirement({ complete, label }: { complete: boolean; label: string }) {
    return (
        <span className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 ${complete ? 'border-success/35 bg-success/8 text-success' : 'border-border-subtle text-muted'}`}>
            <span aria-hidden="true">{complete ? '✓' : '○'}</span>
            {label}
        </span>
    );
}
