import type { UserRole } from '../../types/auth';

export interface Family {
    id: string;
    name: string;
    slug?: string | null;
    created_at?: string;
    memberCount?: number;
}

export interface FamilyUser {
    id: string;
    email: string;
    role: UserRole;
    family_id?: string | null;
    familyName?: string;
    created_at?: string;
}

export interface CreateUserData {
    email: string;
    password: string;
    role: UserRole;
    family_id: string;
}
