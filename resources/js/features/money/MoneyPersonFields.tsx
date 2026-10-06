import { useState } from 'react';

import { Button, Field, SelectField } from '../../components/ui';
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
    const [creating, setCreating] = useState(false);
    const [search, setSearch] = useState('');
    const options = people.filter((person) => person.archivedAt === null || person.id === selectedPerson?.id);
    if (selectedPerson && !options.some((person) => person.id === selectedPerson.id)) options.push(selectedPerson);
    const matchingPeople = options.filter((person) => person.id === personId || `${person.name} ${person.nickname ?? ''}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));

    return (
        <div className="space-y-3">
            {creating ? <Field error={nameError} label="New Person name" maxLength={120} onChange={(event) => onChange('', event.target.value)} required value={personName} /> : <>
                {options.length > 6 && <Field label="Find a Person" onChange={(event) => setSearch(event.target.value)} type="search" value={search} />}
                <SelectField error={personError} label="Person (optional)" onChange={(event) => onChange(event.target.value ? Number(event.target.value) : '', '')} options={[{ label: 'No Person', value: '' }, ...matchingPeople.map((person) => ({ label: `${person.name}${person.nickname ? ` · ${person.nickname}` : ''}${person.archivedAt ? ' · Archived' : ''}`, value: String(person.id) }))]} value={personId} />
            </>}
            <Button onClick={() => { setCreating(!creating); onChange('', ''); }} size="small" variant="ghost">{creating ? 'Choose an existing Person' : 'Add a new Person'}</Button>
            <p className="text-xs text-muted">This links the transaction to a Person without creating a debt.</p>
        </div>
    );
}
