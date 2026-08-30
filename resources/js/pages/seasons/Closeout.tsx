import { Head } from '@inertiajs/react';

import { SeasonCloseoutPanel } from '../../features/seasons/SeasonCloseoutPanel';
import type { SeasonCloseoutData } from '../../features/seasons/closeoutTypes';

export default function Closeout({ closeout }: { closeout: SeasonCloseoutData }) {
    return (
        <div className="mx-auto max-w-6xl">
            <Head title={`Season ${closeout.seasonNumber} closeout`} />
            <SeasonCloseoutPanel closeout={closeout} />
        </div>
    );
}
