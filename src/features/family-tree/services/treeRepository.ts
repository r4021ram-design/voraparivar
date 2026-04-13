/**
 * Tree Repository — single place responsible for loading, saving, refreshing,
 * importing, exporting, and resetting tree data.
 *
 * Sources are tried in priority order: Supabase → localStorage → seed JSON.
 */

import { supabase } from '../../../lib/supabase';
import type { Person } from '../../../types/person';
import type { PersonRow } from '../../../types/db';
import { buildTreeFromRows, flattenTreeToRows } from './treeMapper';
import { loadFamilyTreeData } from '../../../data';
import { validatePerson } from '../../../utils/validateTree';

const LOCAL_STORAGE_KEY = 'vanshavali_data_v3';

// ────────────────────────────────────────────
// Loading
// ────────────────────────────────────────────

/** Load tree from Supabase. Returns null if empty or on error. */
export async function loadTreeFromDb(): Promise<Person | null> {
    try {
        const { data: people, error } = await supabase
            .from('people')
            .select('*');

        if (error) throw error;
        if (!people || people.length === 0) return null;

        return buildTreeFromRows(people as PersonRow[]);
    } catch (err) {
        console.error('Failed to load tree from DB:', err);
        return null;
    }
}

/** Load tree from localStorage. Returns null if absent or corrupt. */
export function loadTreeFromLocal(): Person | null {
    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as Person;
    } catch (err) {
        console.error('Failed to parse local tree:', err);
        return null;
    }
}

/** Load tree from the seed JSON file (/public/vanshavali_edited.json). */
export async function loadTreeFromSeed(): Promise<Person> {
    return loadFamilyTreeData();
}

/**
 * Load tree using priority chain: Supabase → localStorage → seed JSON.
 * Guaranteed to return a Person (seed is the last resort).
 */
export async function loadTree(): Promise<Person> {
    const dbTree = await loadTreeFromDb();
    if (dbTree) return dbTree;

    const localTree = loadTreeFromLocal();
    if (localTree) return localTree;

    return loadTreeFromSeed();
}

// ────────────────────────────────────────────
// Saving
// ────────────────────────────────────────────

/** Persist tree to localStorage. */
export function saveTreeToLocal(tree: Person): void {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tree));
    } catch (err) {
        console.error('Failed to save tree to localStorage:', err);
    }
}

/**
 * Full sync of the current tree snapshot to Supabase.
 * Upserts all nodes and deletes orphans.
 */
export async function saveTree(tree: Person): Promise<{ success: boolean; error?: string }> {
    try {
        const rows = flattenTreeToRows(tree);

        const { error: upsertError } = await supabase.from('people').upsert(rows);
        if (upsertError) return { success: false, error: `Upsert Error: ${upsertError.message}` };

        const { data: currentDbNodes, error: fetchError } = await supabase.from('people').select('id');
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
    } catch (err: any) {
        console.error('Bulk sync to Supabase failed:', err);
        return { success: false, error: err.message };
    }
}

// ────────────────────────────────────────────
// Reset
// ────────────────────────────────────────────

/** Clear localStorage and reload from seed. */
export async function resetTree(): Promise<Person> {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    return loadTreeFromSeed();
}

// ────────────────────────────────────────────
// Import / Export
// ────────────────────────────────────────────

/** Export the tree as a downloadable JSON file. */
export function exportTree(tree: Person): void {
    const jsonString = JSON.stringify({ tree }, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vanshavali_edited.json';
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
