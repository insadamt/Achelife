import { router } from '@inertiajs/react';
import { Download, Wrench } from 'lucide-react';

import { Button } from '../../components/ui';
import { MoneyDrawer } from './MoneyDrawer';

export interface MoneyPresetPackData {
    version: number;
    installedVersion: number;
    categoryCount: number;
    subcategoryCount: number;
    missingCategoryCount: number;
    missingSubcategoryCount: number;
    categories: Array<{
        key: string;
        name: string;
        type: 'income' | 'expense';
        subcategories: string[];
    }>;
}

export function MoneyPresetPackDrawer({ onClose, pack }: { onClose: () => void; pack: MoneyPresetPackData }) {
    const missingCount = pack.missingCategoryCount + pack.missingSubcategoryCount;

    function installMissingPresets() {
        router.post('/money/presets/install', {}, { preserveScroll: true, onSuccess: onClose });
    }

    return (
        <MoneyDrawer onClose={onClose} open title={`Money presets · v${pack.version}`}>
            <div className="rounded-2xl border border-border-subtle bg-surface p-4 text-sm text-secondary">
                <p className="font-bold text-foreground">{pack.categoryCount} Categories · {pack.subcategoryCount} Subcategories</p>
                <p className="mt-1">Preset names can be renamed, archived, or deleted under the same rules as your own Categories. Stable keys remain unchanged.</p>
            </div>

            <div className="mt-5 space-y-3">
                {pack.categories.map((category) => (
                    <section className="rounded-2xl border border-border-subtle bg-app p-4" key={category.key}>
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="font-bold text-foreground">{category.name}</h3>
                            <span className="text-[0.625rem] font-bold tracking-[0.12em] text-muted uppercase">{category.type}</span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-secondary">{category.subcategories.join(' · ')}</p>
                    </section>
                ))}
            </div>

            <div className="sticky bottom-0 mt-6 border-t border-border-subtle bg-elevated pt-4">
                <Button disabled={missingCount === 0} fullWidth onClick={installMissingPresets}>
                    {missingCount > 0 ? <Download aria-hidden="true" size={17} /> : <Wrench aria-hidden="true" size={17} />}
                    {missingCount > 0 ? `Install ${missingCount} missing presets` : 'Preset pack is complete'}
                </Button>
                {pack.installedVersion > 0 && <p className="mt-2 text-center text-xs text-muted">Installed pack version: {pack.installedVersion}</p>}
            </div>
        </MoneyDrawer>
    );
}
