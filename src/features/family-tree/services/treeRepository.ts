/**
 * Tree Repository — single place responsible for loading, saving, refreshing,
 * importing, exporting, and resetting tree data.
 *
 * Sources are tried in priority order: Supabase → localStorage → seed JSON.
 * Supports multi-family trees via familyId.
 */

import { supabase } from '../../../lib/supabase';
import type { Person } from '../../../types/person';
import type { PersonRow } from '../../../types/db';
import { buildTreeFromRows, flattenTreeToRows } from './treeMapper';
import { loadFamilyTreeData } from '../../../data';
import { validatePerson } from '../../../utils/validateTree';
import { ensurePersonTranslations } from '../../../utils/transliterate';

export const DEFAULT_FAMILY_ID = 'vora-parivar';
const LOCAL_STORAGE_KEY_BASE = 'vanshavali_data_v3';

function getStorageKey(familyId: string = DEFAULT_FAMILY_ID): string {
    return `${LOCAL_STORAGE_KEY_BASE}_${familyId}`;
}

// ────────────────────────────────────────────
// Loading
// ────────────────────────────────────────────

/** Load tree from Supabase for a specific family. Returns null if empty or on error. */
export async function loadTreeFromDb(familyId: string = DEFAULT_FAMILY_ID): Promise<Person | null> {
    try {
        let query = supabase.from('people').select('*');

        if (familyId === DEFAULT_FAMILY_ID) {
            // For default Vora family, allow both explicit 'vora-parivar' and legacy null rows
            query = query.or(`family_id.eq.${familyId},family_id.is.null`);
        } else {
            query = query.eq('family_id', familyId);
        }

        const { data: people, error } = await query;

        if (error) throw error;
        if (!people || people.length === 0) return null;

        return buildTreeFromRows(people as PersonRow[]);
    } catch (err) {
        console.error(`Failed to load tree from DB for family ${familyId}:`, err);
        return null;
    }
}

/** Load tree from localStorage for a specific family. Returns null if absent or corrupt. */
export function loadTreeFromLocal(familyId: string = DEFAULT_FAMILY_ID): Person | null {
    try {
        const key = getStorageKey(familyId);
        let raw = localStorage.getItem(key);
        // Fallback to legacy key for default family
        if (!raw && familyId === DEFAULT_FAMILY_ID) {
            raw = localStorage.getItem(LOCAL_STORAGE_KEY_BASE);
        }
        if (!raw) return null;
        return JSON.parse(raw) as Person;
    } catch (err) {
        console.error(`Failed to parse local tree for family ${familyId}:`, err);
        return null;
    }
}

/** Load tree from the seed JSON file (/public/vanshavali_edited.json). */
export async function loadTreeFromSeed(): Promise<Person> {
    return loadFamilyTreeData();
}

/**
 * Load tree using priority chain: Supabase → localStorage → seed JSON.
 * Guaranteed to return a Person.
 */
export async function loadTree(familyId: string = DEFAULT_FAMILY_ID): Promise<Person> {
    let tree: Person | null = null;
    const dbTree = await loadTreeFromDb(familyId);
    if (dbTree) {
        tree = dbTree;
    } else {
        const localTree = loadTreeFromLocal(familyId);
        if (localTree) {
            tree = localTree;
        } else if (familyId === DEFAULT_FAMILY_ID) {
            tree = await loadTreeFromSeed();
        } else {
            // Default placeholder for a freshly created family
            tree = {
                id: `root-${familyId}`,
                name: 'Mukhya Purush',
                generation: 1,
                gender: 'MALE',
                relation: 'Mukhya Purush',
                children: []
            };
        }
    }

    const enriched = ensurePersonTranslations(tree);
    saveTreeToLocal(enriched, familyId);
    return enriched;
}

// ────────────────────────────────────────────
// Saving
// ────────────────────────────────────────────

/** Persist tree to localStorage. */
export function saveTreeToLocal(tree: Person, familyId: string = DEFAULT_FAMILY_ID): void {
    try {
        localStorage.setItem(getStorageKey(familyId), JSON.stringify(tree));
    } catch (err) {
        console.error(`Failed to save tree to localStorage for family ${familyId}:`, err);
    }
}

/**
 * Full sync of the current tree snapshot to Supabase for a specific family.
 * Upserts all nodes and deletes orphans belonging ONLY to this family.
 */
export async function saveTree(tree: Person, familyId: string = DEFAULT_FAMILY_ID): Promise<{ success: boolean; error?: string }> {
    try {
        const rows = flattenTreeToRows(tree, null, familyId);

        const { error: upsertError } = await supabase.from('people').upsert(rows);
        if (upsertError) return { success: false, error: `Upsert Error: ${upsertError.message}` };

        // Query only this family's current nodes to find orphans to delete
        let query = supabase.from('people').select('id');
        if (familyId === DEFAULT_FAMILY_ID) {
            query = query.or(`family_id.eq.${familyId},family_id.is.null`);
        } else {
            query = query.eq('family_id', familyId);
        }

        const { data: currentDbNodes, error: fetchError } = await query;
        if (fetchError) return { success: false, error: `Fetch IDs Error: ${fetchError.message}` };

        if (currentDbNodes) {
            const validIds = new Set(rows.map(r => r.id));
            const toDelete = currentDbNodes.map(r => r.id).filter(id => !validIds.has(id));

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
}

// ────────────────────────────────────────────
// Reset
// ────────────────────────────────────────────

/** Clear localStorage and reload from seed. */
export async function resetTree(familyId: string = DEFAULT_FAMILY_ID): Promise<Person> {
    localStorage.removeItem(getStorageKey(familyId));
    if (familyId === DEFAULT_FAMILY_ID) {
        localStorage.removeItem(LOCAL_STORAGE_KEY_BASE);
        return loadTreeFromSeed();
    }
    return loadTree(familyId);
}

// ────────────────────────────────────────────
// Import / Export
// ────────────────────────────────────────────

/** Export the tree as a downloadable JSON file. */
export function exportTree(tree: Person, familyName: string = 'Family'): void {
    const jsonString = JSON.stringify({ tree }, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${familyName.toLowerCase().replace(/\s+/g, '_')}_tree.json`;
    a.click();
    URL.revokeObjectURL(url);
}

/** Validate and normalize imported JSON into a Person tree. */
export function importTree(raw: unknown): Person {
    if (!raw || typeof raw !== 'object') {
        throw new Error('Import data must be a JSON object');
    }

    const obj = raw as Record<string, unknown>;
    const treeData = (obj.tree ?? obj) as Record<string, unknown>;

    const validation = validatePerson(treeData);
    if (!validation.valid) {
        throw new Error(`Import validation failed:\n${validation.errors.join('\n')}`);
    }

    // Ensure children arrays exist
    const normalized = normalizeChildren(treeData as unknown as Person);
    return normalized;
}

/** Recursively ensure every node has a children array. */
function normalizeChildren(node: Person): Person {
    return {
        ...node,
        children: (node.children ?? []).map(normalizeChildren),
    };
}
