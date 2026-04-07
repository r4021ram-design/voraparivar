import { supabase } from '../lib/supabase';
import type { Person } from '../types';

export const flattenTreeForDb = (root: Person, parentId: string | null = null): any[] => {
    const row = {
        id: root.id,
        parent_id: parentId,
        name: root.name,
        gender: root.gender,
        relation: root.relation || null,
        generation: root.generation || 1,
        bio: root.bio || null,
        occupation: root.occupation || null,
        dob: root.dateOfBirth || null,
        dod: root.dateOfDeath || null,
        phone: root.phoneNumber || null,
        spouse_name: root.spouse || null,
        spouse_occupation: root.spouseOccupation || null,
        spouse_phone: root.spousePhoneNumber || null,
        spouse_dob: root.spouseDateOfBirth || null,
        spouse_dod: root.spouseDateOfDeath || null,
        location_name: root.location?.name || null,
        location_lat: root.location?.lat || null,
        location_lng: root.location?.lng || null
    };

    let rows = [row];
    if (root.children) {
        for (const child of root.children) {
            rows = rows.concat(flattenTreeForDb(child, root.id));
        }
    }
    return rows;
};

export const bulkSyncTreeToDb = async (root: Person): Promise<boolean> => {
    try {
        const rows = flattenTreeForDb(root);

        // 1. Upsert all valid rows from the snapshot
        const { error: upsertError } = await supabase.from('people').upsert(rows);
        if (upsertError) throw upsertError;

        // 2. Fetch all current DB IDs
        const { data: currentDbNodes, error: fetchError } = await supabase.from('people').select('id');
        if (fetchError) throw fetchError;

        // 3. Delete any nodes in DB that aren't in this snapshot
        if (currentDbNodes) {
            const validIds = rows.map(r => r.id);
            const dbIds = currentDbNodes.map(r => r.id);
            const toDelete = dbIds.filter(id => !validIds.includes(id));

            if (toDelete.length > 0) {
                // Supabase IN clause has a limit (often 1000), but family trees are usually < 500 for demo
                const { error: deleteError } = await supabase.from('people').delete().in('id', toDelete);
                if (deleteError) throw deleteError;
            }
        }

        return true;
    } catch (err) {
        console.error("Bulk sync to Supabase failed:", err);
        return false;
    }
};
