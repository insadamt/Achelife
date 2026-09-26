import { router, usePage } from '@inertiajs/react';
import { Layers3, Square } from 'lucide-react';
import { useState } from 'react';

import { classNames } from '../../components/ui/classNames';
import type { SharedPageProps } from '../../types';

const styleOptions = [
    { value: 'normal', label: 'Normal', description: 'The original solid surfaces', icon: Square },
    { value: 'glass', label: 'Frosted glass', description: 'Translucent surfaces over your background', icon: Layers3 },
] as const;

export function SurfaceStyleSettings() {
    const { appearance } = usePage<SharedPageProps>().props;
    const [processing, setProcessing] = useState(false);

    function saveStyle(style: 'normal' | 'glass') {
        if (processing || style === appearance.surfaceStyle) return;

        setProcessing(true);
        router.put('/settings/appearance/style', { surface_style: style }, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <div className="mt-8 border-t border-border-subtle pt-6">
            <h3 className="text-lg font-bold">Surface style</h3>
            <p className="mt-1 text-sm text-muted">Choose how panels look throughout Achelife. This follows your account.</p>
            <div aria-label="Surface style" className="mt-4 grid gap-3 sm:grid-cols-2" role="group">
                {styleOptions.map((option) => {
                    const Icon = option.icon;
                    const selected = appearance.surfaceStyle === option.value;

                    return (
                        <button
                            aria-pressed={selected}
                            className={classNames(
                                'focus-ring flex min-h-20 items-center gap-3 rounded-2xl border p-4 text-left transition-[background-color,border-color,box-shadow] duration-200',
                                selected ? 'border-accent bg-accent/10 shadow-[0_0_0_1px_var(--accent)]' : 'border-border-subtle bg-elevated hover:border-border-strong',
                            )}
                            disabled={processing}
                            key={option.value}
                            onClick={() => saveStyle(option.value)}
                            type="button"
                        >
                            <Icon aria-hidden="true" className={selected ? 'text-accent-ink' : 'text-secondary'} size={22} />
                            <span><span className="block font-bold">{option.label}</span><span className="mt-0.5 block text-sm text-muted">{option.description}</span></span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
