import { supabase } from '../lib/supabase';
import type { Person } from '../types';
import { flattenTreeToRows } from '../features/family-tree/services/treeMapper';

/**
 * @deprecated Use flattenTreeToRows from treeMapper instead.
 * Kept as a thin re-export for any external callers.
 */
export const flattenTreeForDb = (root: Person, parentId: string | null = null, familyId: string = 'vora-parivar') => {
    return flattenTreeToRows(root, parentId, familyId);
};

export const bulkSyncTreeToDb = async (root: Person, familyId: string = 'vora-parivar'): Promise<{ success: boolean; error?: string }> => {
    try {
        const rows = flattenTreeToRows(root, null, familyId);

        // 1. Upsert all valid rows from the snapshot
        const { error: upsertError } = await supabase.from('people').upsert(rows);
        if (upsertError) return { success: false, error: `Upsert Error: ${upsertError.message}` };

        // 2. Fetch current DB IDs for THIS family only
        let query = supabase.from('people').select('id');
        if (familyId === 'vora-parivar') {
            query = query.or(`family_id.eq.${familyId},family_id.is.null`);
        } else {
            query = query.eq('family_id', familyId);
        }

        const { data: currentDbNodes, error: fetchError } = await query;
        if (fetchError) return { success: false, error: `Fetch IDs Error: ${fetchError.message}` };

        // 3. Delete any nodes belonging to THIS family that aren't in this snapshot
        if (currentDbNodes) {
            const validIds = rows.map(r => r.id);
            const dbIds = currentDbNodes.map(r => r.id);
            const toDelete = dbIds.filter(id => !validIds.includes(id));

            if (toDelete.length > 0) {
                const { error: deleteError } = await supabase.from('people').delete().in('id', toDelete);
                if (deleteError) return { success: false, error: `Delete Error: ${deleteError.message}` };
            }
        }

        return { success: true };
    } catch (err: unknown) {
        console.error(`Bulk sync to Supabase failed for family ${familyId}:`, err);
        const error = err instanceof Error ? err.message : String(err);
        return { success: false, error };
    }
};
