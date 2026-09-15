import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Person } from '../types';
import { loadFamilyTreeData } from '../data';
import { buildTreeFromRows } from '../features/family-tree/services/treeMapper';
import type { PersonRow } from '../types/db';

export const useSupabaseTree = () => {
    const [data, setData] = useState<Person | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTree = useCallback(async () => {
        try {
            setLoading(true);
            const { data: people, error: fetchError } = await supabase
                .from('people')
                .select('*');

            if (fetchError) throw fetchError;

            if (!people || people.length === 0) {
                console.log("No data in Supabase, falling back to local/default.");
                // Check local storage or default
                const local = localStorage.getItem('vanshavali_data_v3');
                if (local) setData(JSON.parse(local));
                else setData(await loadFamilyTreeData());
                return;
            }

            // Build tree using centralized mapper
            const tree = buildTreeFromRows(people as PersonRow[]);
            if (tree) {
                setData(tree);
            } else {
                setError("Root node not found in database.");
            }

        } catch (err: unknown) {
            console.error("Error fetching tree:", err);
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            // Fallback: load from localStorage or JSON file when Supabase fails
            try {
                const local = localStorage.getItem('vanshavali_data_v3');
                if (local) {
                    setData(JSON.parse(local));
                } else {
                    setData(await loadFamilyTreeData());
                }
            } catch (fallbackErr) {
                console.error("Fallback also failed:", fallbackErr);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTree();
    }, [fetchTree]);

    return { data, loading, error, refresh: fetchTree };
};
