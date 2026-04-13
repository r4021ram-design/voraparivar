// Auth domain types

export type UserRole = 'ADMIN' | 'STANDARD' | 'VIEW_ONLY';

export interface UserData {
    email: string;
    role: UserRole;
}
