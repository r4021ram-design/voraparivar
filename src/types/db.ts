// Database row types matching the Supabase `people` table schema

import type { PersonTranslations } from './person';

export interface PersonRow {
    id: string;
    parent_id: string | null;
    name: string;
    gender?: 'MALE' | 'FEMALE';
    relation?: string | null;
    generation?: number | null;
    bio?: string | null;
    occupation?: string | null;
    dob?: string | null;
    dod?: string | null;
    phone?: string | null;
    spouse_name?: string | null;
    spouse_occupation?: string | null;
    spouse_phone?: string | null;
    spouse_dob?: string | null;
    spouse_dod?: string | null;
    photo_url?: string | null;
    spouse_photo_url?: string | null;
    anniversary_date?: string | null;
    location_name?: string | null;
    location_lat?: number | null;
    location_lng?: number | null;
    translations?: PersonTranslations | null;
    sort_order?: number | null;
}

export interface ProfileRow {
    id: string;
    role: string;
}
