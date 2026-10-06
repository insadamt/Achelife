import { ChevronRight, UserRound } from 'lucide-react';
import { useState } from 'react';

import { classNames } from '../../components/ui/classNames';
import { MoneyPersonPickerDialog } from './MoneyPersonPickerDialog';
import type { MoneyPersonData } from './types';

export function MoneyPersonFields({ people, selectedPerson, personId, personName, personError, nameError, onChange }: {
    people: MoneyPersonData[];
    selectedPerson: MoneyPersonData | null;
    personId: number | '';
    personName: string;
    personError?: string;
    nameError?: string;
    onChange: (personId: number | '', personName: string) => void;
}) {
    const [pickerOpen, setPickerOpen] = useState(false);
    const options = people.filter((person) => person.archivedAt === null || person.id === selectedPerson?.id);
    if (selectedPerson && !options.some((person) => person.id === selectedPerson.id)) options.push(selectedPerson);
    const person = options.find((option) => option.id === personId);
    const selectedName = person?.name ?? personName;
    const error = personError ?? nameError;

    return (
        <div>
            <p className="text-sm font-semibold text-secondary">Person (optional)</p>
            <button aria-haspopup="dialog" aria-invalid={Boolean(error)} className={classNames('focus-ring mt-2 flex min-h-16 w-full items-center gap-3 rounded-2xl border bg-app px-3 text-left transition-colors hover:bg-surface-hover', error ? 'border-danger' : 'border-border-strong')} onClick={() => setPickerOpen(true)} type="button">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--money-accent)_12%,transparent)] text-accent-ink"><UserRound aria-hidden="true" size={19} /></span>
                <span className="min-w-0 flex-1"><span className={classNames('block break-words text-sm font-bold', !selectedName && 'text-muted')}>{selectedName || 'Choose Person'}</span><span className="mt-0.5 block text-xs text-muted">{personName ? 'New Person · created when saved' : person?.archivedAt ? 'Archived Person' : person?.nickname || (person ? 'Person selected' : 'No Person')}</span></span>
                <ChevronRight aria-hidden="true" className="shrink-0 text-muted" size={18} />
            </button>
            {error && <p className="mt-2 text-sm font-medium text-danger" role="alert">{error}</p>}
            <p className="mt-2 text-xs text-muted">This links the transaction to a Person without creating a debt.</p>
            {pickerOpen && <MoneyPersonPickerDialog onClose={() => setPickerOpen(false)} onSelect={(nextPersonId, nextPersonName) => { onChange(nextPersonId, nextPersonName); setPickerOpen(false); }} people={options} personId={personId} personName={personName} />}
        </div>
    );
}
