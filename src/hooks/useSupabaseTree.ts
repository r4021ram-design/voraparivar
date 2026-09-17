import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Person } from '../types';
import { loadFamilyTreeData } from '../data';
import { buildTreeFromRows } from '../features/family-tree/services/treeMapper';
import type { PersonRow } from '../types/db';

export const useSupabaseTree = (familyId: string = 'vora-parivar') => {
    const [data, setData] = useState<Person | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTree = useCallback(async () => {
        try {
            setLoading(true);
            let query = supabase.from('people').select('*');

            if (familyId === 'vora-parivar') {
                query = query.or(`family_id.eq.${familyId},family_id.is.null`);
            } else {
                query = query.eq('family_id', familyId);
            }

            const { data: people, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            const storageKey = `vanshavali_data_v3_${familyId}`;

            if (!people || people.length === 0) {
                console.log(`No data in Supabase for ${familyId}, checking local storage/defaults.`);
                const local = localStorage.getItem(storageKey);
                if (local) {
                    setData(JSON.parse(local));
                } else if (familyId === 'vora-parivar') {
                    // Fallback to legacy key or seed file for vora
                    const legacy = localStorage.getItem('vanshavali_data_v3');
                    if (legacy) setData(JSON.parse(legacy));
                    else setData(await loadFamilyTreeData());
                } else {
                    // New family initial default
                    const defaultRoot: Person = {
                        id: `root-${familyId}`,
                        name: 'Mukhya Purush',
                        generation: 1,
                        gender: 'MALE',
                        relation: 'Mukhya Purush',
                        children: [],
                    };
                    setData(defaultRoot);
                    // Persist initial root to Supabase to satisfy child foreign keys
                    try {
                        await supabase.from('people').upsert({
                            id: defaultRoot.id,
                            parent_id: null,
                            name: defaultRoot.name,
                            relation: defaultRoot.relation,
                            generation: 1,
                            gender: 'MALE',
                            family_id: familyId,
                        });
                    } catch (upsertErr) {
                        console.error('Failed to auto-upsert root ancestor:', upsertErr);
                    }
                }
                return;
            }

            // Build tree using centralized mapper
            const tree = buildTreeFromRows(people as PersonRow[]);
            if (tree) {
                setData(tree);
            } else {
                setError(`Root node not found in database for family ${familyId}.`);
            }

        } catch (err: unknown) {
            console.error(`Error fetching tree for ${familyId}:`, err);
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            
            // Fallback to local storage
            try {
                const storageKey = `vanshavali_data_v3_${familyId}`;
                const local = localStorage.getItem(storageKey) || (familyId === 'vora-parivar' ? localStorage.getItem('vanshavali_data_v3') : null);
                if (local) {
                    setData(JSON.parse(local));
                } else if (familyId === 'vora-parivar') {
                    setData(await loadFamilyTreeData());
                }
            } catch (fallbackErr) {
                console.error("Fallback also failed:", fallbackErr);
            }
        } finally {
            setLoading(false);
        }
    }, [familyId]);

    useEffect(() => {
        fetchTree();
    }, [fetchTree]);

    return { data, loading, error, refresh: fetchTree };
};
