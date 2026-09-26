import { router, useForm, usePage } from '@inertiajs/react';
import { ImageUp, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';

import { Button } from '../../components/ui';
import type { SharedPageProps } from '../../types';

export function BackgroundSettings() {
    const { appearance } = usePage<SharedPageProps>().props;
    const upload = useForm<{ background: File | null }>({ background: null });
    const inputRef = useRef<HTMLInputElement>(null);
    const [removing, setRemoving] = useState(false);
    const previewStyle = appearance.backgroundUrl === null
        ? undefined
        : { backgroundImage: `url("${appearance.backgroundUrl}")` } as CSSProperties;

    function submit(event: FormEvent) {
        event.preventDefault();
        if (upload.data.background === null) return;

        upload.post('/settings/appearance/background', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                upload.reset();
                if (inputRef.current) inputRef.current.value = '';
            },
        });
    }

    function removeBackground() {
        if (removing) return;
        setRemoving(true);
        router.delete('/settings/appearance/background', {
            preserveScroll: true,
            onFinish: () => setRemoving(false),
        });
    }

    return (
        <div className="mt-8 border-t border-border-subtle pt-6">
            <h3 className="text-lg font-bold">App background</h3>
            <p className="mt-1 text-sm text-muted">Upload a background for every page. Frosted glass uses the city garden when no custom image is set.</p>
            <div aria-label="Current app background" className="appearance-background-preview mt-4 h-36 rounded-2xl border border-border-strong sm:h-44" role="img" style={previewStyle} />
            <p className="mt-2 text-xs text-muted">{appearance.backgroundUrl === null ? 'City garden preview · shown in frosted glass mode' : 'Your uploaded background · shown throughout the app'}</p>

            <form className="mt-4" onSubmit={submit}>
                <label className="block text-sm font-semibold" htmlFor="appearance-background">Choose an image</label>
                <input
                    accept=".jpg,.jpeg,.png,.webp,.avif,image/jpeg,image/png,image/webp,image/avif"
                    className="focus-ring mt-2 block w-full rounded-2xl border border-border-strong bg-app p-3 text-sm"
                    id="appearance-background"
                    onChange={(event) => upload.setData('background', event.target.files?.[0] ?? null)}
                    ref={inputRef}
                    type="file"
                />
                <p className="mt-2 text-xs text-muted">JPG/JPEG, PNG, WebP, or AVIF · up to 8 MB</p>
                {upload.errors.background && <p className="mt-2 text-sm font-semibold text-danger" role="alert">{upload.errors.background}</p>}
                <div className="mt-4 flex flex-wrap gap-3">
                    <Button disabled={upload.processing || upload.data.background === null} type="submit"><ImageUp aria-hidden="true" size={17} />{upload.processing ? 'Uploading…' : 'Use this background'}</Button>
                    {appearance.backgroundUrl !== null && <Button disabled={removing} onClick={removeBackground} type="button" variant="secondary"><Trash2 aria-hidden="true" size={17} />Remove custom image</Button>}
                </div>
            </form>
        </div>
    );
}
