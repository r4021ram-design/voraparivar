import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Person } from '../types';
import { familyTreeData } from '../data';

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
                else setData(familyTreeData);
                return;
            }

            // Build Tree from Flat Data
            const buildTree = (parentId: string | null): Person[] => {
                return people
                    .filter(p => p.parent_id === parentId)
                    .map(p => ({
                        id: p.id,
                        name: p.name,
                        gender: p.gender,
                        relation: p.relation,
                        generation: p.generation,
                        bio: p.bio,
                        occupation: p.occupation,
                        dateOfBirth: p.dob,
                        dateOfDeath: p.dod,
                        phoneNumber: p.phone,
                        spouse: p.spouse_name,
                        spouseOccupation: p.spouse_occupation,
                        spousePhoneNumber: p.spouse_phone,
                        spouseDateOfBirth: p.spouse_dob,
                        spouseDateOfDeath: p.spouse_dod,
                        location: p.location_name ? { name: p.location_name, lat: p.location_lat, lng: p.location_lng } : undefined,
                        children: buildTree(p.id), // Recursion
                        isCollapsed: false // Default state
                        // Add photoUrl logic later if joined
                    }));
            };

            const root = people.find(p => p.parent_id === null);
            if (root) {
                const tree = {
                    ...root,
                    id: root.id,
                    name: root.name,
                    gender: root.gender,
                    relation: root.relation,
                    generation: root.generation,
                    bio: root.bio,
                    occupation: root.occupation,
                    dateOfBirth: root.dob,
                    dateOfDeath: root.dod,
                    phoneNumber: root.phone,
                    spouse: root.spouse_name,
                    spouseOccupation: root.spouse_occupation,
                    spousePhoneNumber: root.spouse_phone,
                    spouseDateOfBirth: root.spouse_dob,
                    spouseDateOfDeath: root.spouse_dod,
                    location: root.location_name ? { name: root.location_name, lat: root.location_lat, lng: root.location_lng } : undefined,
                    children: buildTree(root.id)
                } as Person;
                setData(tree);
            } else {
                // Handle case where no root is found but data exists (orphans?)
                // Just take the first one or error
                setError("Root node not found in database.");
            }

        } catch (err: any) {
            console.error("Error fetching tree:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTree();
    }, []);

    return { data, loading, error, refresh: fetchTree };
};
