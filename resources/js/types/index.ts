import type { RecordedViolationFlashData } from '../features/constitution/types';
import type { ProgressPanelData } from '../features/progress/types';

export interface AuthenticatedUser {
    id: number;
    name: string;
    email: string;
    timezone: string;
}

export interface SharedPageProps {
    name: string;
    auth: {
        user: AuthenticatedUser | null;
    };
    flash: {
        constitutionViolation: RecordedViolationFlashData | null;
    };
    progressPanel: ProgressPanelData | null;
    [key: string]: unknown;
}
