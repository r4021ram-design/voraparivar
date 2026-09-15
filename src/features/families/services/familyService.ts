import { supabase } from '../../../lib/supabase';
import type { Family, FamilyUser, CreateUserData } from '../types';
import type { FamilyRow } from '../../../types/db';

/** Default family fallback if no family is specified */
export const DEFAULT_FAMILY_ID = 'vora-parivar';
export const DEFAULT_FAMILY_NAME = 'Vora Parivar';

/**
 * Fetch all registered families, along with member counts.
 */
export async function fetchFamilies(): Promise<Family[]> {
    try {
        const { data: families, error } = await supabase
            .from('families')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.warn('Families table error or not yet created, returning default:', error);
            return [{ id: DEFAULT_FAMILY_ID, name: DEFAULT_FAMILY_NAME, slug: 'vora' }];
        }

        if (!families || families.length === 0) {
            return [{ id: DEFAULT_FAMILY_ID, name: DEFAULT_FAMILY_NAME, slug: 'vora' }];
        }

        // Count members per family
        const { data: counts } = await supabase
            .from('people')
            .select('family_id');

        const countMap: Record<string, number> = {};
        if (counts) {
            counts.forEach((row: { family_id?: string | null }) => {
                const fid = row.family_id || DEFAULT_FAMILY_ID;
                countMap[fid] = (countMap[fid] || 0) + 1;
            });
        }

        return families.map((f: FamilyRow) => ({
            id: f.id,
            name: f.name,
            slug: f.slug,
            created_at: f.created_at,
            memberCount: countMap[f.id] || 0,
        }));
    } catch (err) {
        console.error('Error fetching families:', err);
        return [{ id: DEFAULT_FAMILY_ID, name: DEFAULT_FAMILY_NAME, slug: 'vora' }];
    }
}

/**
 * Create a new family and optionally its initial root ancestor node.
 */
export async function createFamily(name: string, rootPersonName?: string): Promise<{ success: boolean; family?: Family; error?: string }> {
    try {
        const trimmedName = name.trim();
        if (!trimmedName) return { success: false, error: 'Family name cannot be empty' };

        // Generate slug / ID
        const slug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const id = slug || `family-${Date.now()}`;

        const { error: insertError } = await supabase
            .from('families')
            .insert({
                id,
                name: trimmedName,
                slug,
            });

        if (insertError) throw insertError;

        // If root ancestor name provided, create initial root person in people table
        if (rootPersonName && rootPersonName.trim()) {
            const rootId = `root-${id}`;
            await supabase.from('people').insert({
                id: rootId,
                parent_id: null,
                name: rootPersonName.trim(),
                relation: 'Mukhya Purush',
                generation: 1,
                gender: 'MALE',
                family_id: id,
            });
        }

        return {
            success: true,
            family: { id, name: trimmedName, slug, memberCount: rootPersonName ? 1 : 0 },
        };
    } catch (err: any) {
        console.error('Error creating family:', err);
        return { success: false, error: err.message || 'Failed to create family' };
    }
}

/**
 * Fetch all users across families with their roles.
 */
export async function fetchFamilyUsers(): Promise<FamilyUser[]> {
    try {
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, role, family_id, email, created_at');

        if (error) throw error;
        if (!profiles) return [];

        const { data: families } = await supabase
            .from('families')
            .select('id, name');

        const familyMap: Record<string, string> = {};
        if (families) {
            families.forEach((f: { id: string; name: string }) => {
                familyMap[f.id] = f.name;
            });
        }

        return profiles.map((p: any) => ({
            id: p.id,
            email: p.email || 'No email',
            role: p.role,
            family_id: p.family_id,
            familyName: p.family_id ? (familyMap[p.family_id] || p.family_id) : 'All Families (Admin)',
            created_at: p.created_at,
        }));
    } catch (err) {
        console.error('Error fetching family users:', err);
        return [];
    }
}

/**
 * Create a new user without logging out the current Admin session using RPC.
 */
export async function createFamilyUser(data: CreateUserData): Promise<{ success: boolean; error?: string }> {
    try {
        const { data: res, error } = await supabase.rpc('create_family_user', {
            new_email: data.email.trim(),
            new_password: data.password,
            user_role: data.role,
            target_family_id: data.family_id,
        });

        if (error) throw error;
        if (res && res.error) throw new Error(res.error);

        return { success: true };
    } catch (err: any) {
        console.error('Error creating family user:', err);
        return { success: false, error: err.message || 'Failed to create user' };
    }
}

/**
 * Reset password for a family user via RPC.
 */
export async function resetFamilyUserPassword(userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase.rpc('reset_family_user_password', {
            target_user_id: userId,
            new_password: newPassword,
        });

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        console.error('Error resetting password:', err);
        return { success: false, error: err.message || 'Failed to reset password' };
    }
}

/**
 * Delete a family user via RPC.
 */
export async function deleteFamilyUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase.rpc('delete_family_user', {
            target_user_id: userId,
        });

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        console.error('Error deleting user:', err);
        return { success: false, error: err.message || 'Failed to delete user' };
    }
}
