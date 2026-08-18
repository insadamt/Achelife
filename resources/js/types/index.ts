export interface AuthenticatedUser {
    id: number;
    name: string;
    email: string;
}

export interface SharedPageProps {
    name: string;
    auth: {
        user: AuthenticatedUser | null;
    };
    flash: {
        constitutionPenalty: number | null;
    };
    [key: string]: unknown;
}
