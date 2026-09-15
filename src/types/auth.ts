// Auth domain types

export type UserRole = 'ADMIN' | 'STANDARD' | 'VIEW_ONLY';

export interface UserData {
    id?: string;
    email: string;
    role: UserRole;
    family_id?: string | null;
}
