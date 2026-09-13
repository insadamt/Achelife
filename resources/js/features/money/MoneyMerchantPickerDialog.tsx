import { Check, Search, Store, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button, Dialog } from '../../components/ui';
import { classNames } from '../../components/ui/classNames';
import type { MoneyMerchantOptionData } from './types';

export function MoneyMerchantPickerDialog({ merchants, onClose, onSelect, open, selectedName }: {
    merchants: MoneyMerchantOptionData[];
    onClose: () => void;
    onSelect: (name: string) => void;
    open: boolean;
    selectedName: string;
}) {
    const [query, setQuery] = useState('');
    const activeMerchants = useMemo(() => {
        const normalizedQuery = query.trim().toLocaleLowerCase();
        return merchants.filter((merchant) => merchant.archivedAt == null
            && (normalizedQuery === '' || merchant.name.toLocaleLowerCase().includes(normalizedQuery)));
    }, [merchants, query]);

    return (
        <Dialog description="Search or browse your active Merchants." onClose={onClose} open={open} title="Choose Merchant">
            <label className="relative block">
                <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" size={17} />
                <span className="sr-only">Search Merchants</span>
                <input autoFocus className="focus-ring min-h-12 w-full rounded-2xl border border-border-strong bg-app pr-4 pl-11 text-sm" onChange={(event) => setQuery(event.target.value)} placeholder="Search Merchants" value={query} />
            </label>
            <div className="mt-4 grid max-h-[min(60vh,28rem)] grid-cols-2 gap-2 overflow-y-auto pr-1">
                <button className={classNames('focus-ring col-span-2 flex min-h-14 items-center justify-between rounded-2xl border px-4 text-left text-sm font-bold', selectedName === '' ? 'border-[var(--money-accent)] bg-[color-mix(in_srgb,var(--money-accent)_10%,transparent)]' : 'border-border-subtle bg-app hover:bg-surface-hover')} onClick={() => onSelect('')} type="button">
                    <span className="flex items-center gap-2"><X aria-hidden="true" size={16} />No Merchant</span>
                    {selectedName === '' && <Check aria-hidden="true" size={17} />}
                </button>
                {activeMerchants.map((merchant) => {
                    const selected = merchant.name.toLocaleLowerCase() === selectedName.toLocaleLowerCase();
                    return (
                        <button className={classNames('focus-ring flex min-h-20 items-center gap-3 rounded-2xl border bg-app p-3 text-left hover:bg-surface-hover', selected ? 'border-[var(--money-accent)]' : 'border-border-subtle')} key={merchant.id} onClick={() => onSelect(merchant.name)} type="button">
                            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--money-accent)_12%,transparent)] text-accent-ink"><Store aria-hidden="true" size={19} /></span>
                            <span className="min-w-0 flex-1 truncate text-sm font-bold">{merchant.name}</span>
                            {selected && <Check aria-hidden="true" className="shrink-0" size={16} />}
                        </button>
                    );
                })}
            </div>
            {activeMerchants.length === 0 && <p className="mt-5 rounded-2xl border border-dashed border-border-strong p-5 text-center text-sm text-muted">No matching active Merchants.</p>}
            <Button className="mt-5" fullWidth onClick={onClose} variant="ghost">Cancel</Button>
        </Dialog>
    );
}
