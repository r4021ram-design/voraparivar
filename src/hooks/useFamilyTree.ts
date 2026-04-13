import { useState, useCallback, useEffect } from 'react';
import type { Person } from '../types';
import { EMPTY_ROOT } from '../data';
import { useSupabaseTree } from './useSupabaseTree';
import { useHistory } from './useHistory';
import { supabase } from '../lib/supabase';
import { bulkSyncTreeToDb } from '../utils/dbSync';
import { bulkTranslateTree } from '../utils/bulkTranslate';
import { saveTreeToLocal } from '../features/family-tree/services/treeRepository';
import {
    updatePersonInTree,
    addChildToTree,
    deletePersonFromTree,
} from '../features/family-tree/utils/treeTransforms';

export const useFamilyTree = (userRole: string) => {
    const { data: dbData, loading: dbLoading, refresh: refreshDb } = useSupabaseTree();
    const [currentData, setCurrentData] = useState<Person>(EMPTY_ROOT);
    const [isBulkTranslating, setIsBulkTranslating] = useState(false);
    const [translationProgress, setTranslationProgress] = useState<{ current: number, total: number } | null>(null);

    const { pushState, undo, redo, canUndo, canRedo, resetHistory } = useHistory(null);

    // Sync from DB or Local Storage on load
    useEffect(() => {
        if (dbData) {
            console.log("Loaded data from Supabase");
            setCurrentData(dbData);
            resetHistory(dbData);
        } else if (!dbLoading) {
            console.log("No DB data or Error, checking local storage.");
            const local = localStorage.getItem('vanshavali_data_v3');
            if (local) {
                try {
                    const parsed = JSON.parse(local);
                    setCurrentData(parsed);
                } catch (e) {
                    console.error("Failed to parse local storage", e);
                }
            }
        }
    }, [dbData, dbLoading, resetHistory]);

    const handleSaveEdit = useCallback(async (updatedPerson: Person) => {
        setCurrentData(prev => {
            const newData = updatePersonInTree(prev, updatedPerson);
            setTimeout(() => pushState(newData), 0);
            return newData;
        });

        // Sync to DB
        try {
            const { error } = await supabase.from('people').update({
                name: updatedPerson.name,
                gender: updatedPerson.gender,
                relation: updatedPerson.relation,
                bio: updatedPerson.bio,
                occupation: updatedPerson.occupation,
                dob: updatedPerson.dateOfBirth,
                dod: updatedPerson.dateOfDeath,
                phone: updatedPerson.phoneNumber,
                spouse_name: updatedPerson.spouse,
                spouse_occupation: updatedPerson.spouseOccupation,
                spouse_phone: updatedPerson.spousePhoneNumber,
                spouse_dob: updatedPerson.spouseDateOfBirth,
                spouse_dod: updatedPerson.spouseDateOfDeath,
                photo_url: updatedPerson.photoUrl,
                spouse_photo_url: updatedPerson.spousePhotoUrl,
                anniversary_date: updatedPerson.anniversaryDate,
                location_name: updatedPerson.location?.name,
                location_lat: updatedPerson.location?.lat,
                location_lng: updatedPerson.location?.lng,
                translations: updatedPerson.translations,
                sort_order: updatedPerson.sort_order,
            }).eq('id', updatedPerson.id);

            if (error) throw error;
            refreshDb();
        } catch (e) {
            console.error("Error updating DB:", e);
        }
    }, [refreshDb, pushState]);

    const handleAddChild = useCallback(async (parentId: string, type: 'son' | 'daughter') => {
        const newChildId = crypto.randomUUID();
        const isMale = type === 'son';
        let parentGen = 1;

        // Find parent generation before tree update
        const findGen = (root: Person): void => {
            if (root.id === parentId) { parentGen = root.generation; return; }
            root.children?.forEach(findGen);
        };

        setCurrentData((prevData) => {
            findGen(prevData);
            const newChild: Person = {
                id: newChildId,
                name: `New ${type === 'son' ? 'Son' : 'Daughter'}`,
                generation: parentGen + 1,
                relation: type === 'son' ? 'Son' : 'Daughter',
                gender: isMale ? 'MALE' : 'FEMALE',
                children: [],
            };
            const newData = addChildToTree(prevData, parentId, newChild);
            setTimeout(() => pushState(newData), 0);
            return newData;
        });

        try {
            const { error } = await supabase.from('people').insert({
                id: newChildId,
                parent_id: parentId,
                name: `New ${type === 'son' ? 'Son' : 'Daughter'}`,
                gender: isMale ? 'MALE' : 'FEMALE',
                relation: type === 'son' ? 'Son' : 'Daughter',
                generation: parentGen + 1,
            });
            if (error) throw error;
            refreshDb();
        } catch (e) {
            console.error("Error adding child to DB:", e);
        }
    }, [refreshDb, pushState]);

    const handleDelete = useCallback(async (personId: string) => {
        if (personId === 'root') return;
        if (!confirm("Are you sure? This will delete the person and ALL descendants.")) return;

        setCurrentData((prevData) => {
            const newData = deletePersonFromTree(prevData, personId);
            if (!newData) return prevData;
            setTimeout(() => pushState(newData), 0);
            return newData;
        });

        try {
            const { error } = await supabase.from('people').delete().eq('id', personId);
            if (error) throw error;
            refreshDb();
        } catch (e) {
            console.error("Failed to delete from DB:", e);
        }
    }, [refreshDb, pushState]);

    const handleBulkTranslate = async () => {
        if (!currentData || isBulkTranslating) return;
        if (!confirm("Proceed with AI Translation?")) return;

        setIsBulkTranslating(true);
        setTranslationProgress({ current: 0, total: 1 });

        try {
            const updatedTree = await bulkTranslateTree(currentData, (current, total) => {
                setTranslationProgress({ current, total });
            });

            setCurrentData(updatedTree);
            pushState(updatedTree);
            
            saveTreeToLocal(updatedTree);

            const syncResult = await bulkSyncTreeToDb(updatedTree);
            if (syncResult.success) refreshDb();
        } catch (error) {
            console.error("Bulk translation failed:", error);
        } finally {
            setIsBulkTranslating(false);
            setTranslationProgress(null);
        }
    };

    const handleUndo = useCallback(async () => {
        if (!canUndo) return;
        const previousState = undo();
        if (previousState) {
            setCurrentData(previousState);
            if (userRole === 'ADMIN') {
                const success = await bulkSyncTreeToDb(previousState);
                if (success) refreshDb();
            }
        }
    }, [canUndo, undo, userRole, refreshDb]);

    const handleRedo = useCallback(async () => {
        if (!canRedo) return;
        const nextState = redo();
        if (nextState) {
            setCurrentData(nextState);
            if (userRole === 'ADMIN') {
                const success = await bulkSyncTreeToDb(nextState);
                if (success) refreshDb();
            }
        }
    }, [canRedo, redo, userRole, refreshDb]);

    return {
        currentData,
        setCurrentData,
        dbLoading,
        isBulkTranslating,
        translationProgress,
        handleAddChild,
        handleDelete,
        handleSaveEdit,
        handleBulkTranslate,
        handleUndo,
        handleRedo,
        canUndo,
        canRedo,
        refreshDb
    };
};
