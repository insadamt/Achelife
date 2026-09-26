import { Head } from '@inertiajs/react';

import { PageChrome, PageHeader } from '../../components/ui';
import { SeasonCloseoutPanel } from '../../features/seasons/SeasonCloseoutPanel';
import type { SeasonCloseoutData } from '../../features/seasons/closeoutTypes';

export default function Closeout({ closeout }: { closeout: SeasonCloseoutData }) {
    return (
        <div className="page-rail mx-auto w-full max-w-[80rem]">
            <Head title={`Season ${closeout.seasonNumber} closeout`} />
            <PageChrome><PageHeader title={`Season ${closeout.seasonNumber} closeout`} /></PageChrome>
            <SeasonCloseoutPanel closeout={closeout} />
        </div>
    );
}
