import type { RecordedViolationFlashData } from '../features/constitution/types';
import type { ProgressPanelData } from '../features/progress/types';
import type { FocusSessionData } from '../features/focus/types';

export interface AuthenticatedUser {
    id: number;
    name: string;
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
    activeFocusSession: FocusSessionData | null;
    openFocusSessions: FocusSessionData[];
    [key: string]: unknown;
}
