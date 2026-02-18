import { supabase } from '../lib/supabase';
import type { Person } from '../types';
import { familyTreeData } from '../data';

export const migrateDataToSupabase = async () => {
    console.log("Starting migration...");

    // 0. Check if data already exists
    const { count, error: countError } = await supabase
        .from('people')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error("Error checking existing data:", countError);
        alert("Failed to check existing data in Supabase.");
        return;
    }

    if (count !== null && count > 0) {
        const proceed = confirm(`Supabase already contains ${count} records. Do you want to proceed? This might create duplicates.`);
        if (!proceed) {
            console.log("Migration aborted by user.");
            return;
        }
    }

    // 1. Get data from LocalStorage or Fallback
    const localData = localStorage.getItem('vanshavali_data_v3');
    const rootNode: Person = localData ? JSON.parse(localData) : familyTreeData;

    if (!rootNode) {
        console.error("No data found to migrate.");
        return;
    }

    // 2. Clear existing data (Optional, handle with care)
    // await supabase.from('people').delete().neq('id', '00000000-0000-0000-0000-000000000000'); 

    // 3. Recursive Insert Function
    const insertPerson = async (person: Person, parentId: string | null) => {

        // Prepare payload
        const payload = {
            name: person.name,
            gender: person.gender,
            relation: person.relation,
            generation: person.generation,
            bio: person.bio,
            occupation: person.occupation,
            // dob: person.dateOfBirth ? new Date(person.dateOfBirth) : null, // Needs robust parsing
            // dod: person.dateOfDeath ? new Date(person.dateOfDeath) : null,
            phone: person.phoneNumber,
            spouse_name: person.spouse,
            spouse_occupation: person.spouseOccupation,
            spouse_phone: person.spousePhoneNumber,
            spouse_dob: person.spouseDateOfBirth, // Kept raw string? Postgres expects date/timestamptz.
            spouse_dod: person.spouseDateOfDeath, // It's safer to not cast if the format is unsure, but supabase might error. 
            // In App.tsx insert, it wasn't casting either. Let's assume the string format YYYY-MM-DD matches or is null.
            parent_id: parentId
        };

        // Insert
        const { data, error } = await supabase
            .from('people')
            .insert(payload)
            .select() // Return the created record to get the new UUID
            .single();

        if (error) {
            console.error(`Error inserting ${person.name}:`, error);
            return;
        }

        const newId = data.id;
        console.log(`Migrated: ${person.name} -> ${newId}`);

        // Migrate Children
        if (person.children && person.children.length > 0) {
            for (const child of person.children) {
                await insertPerson(child, newId);
            }
        }
    };

    // 4. Start Migration
    await insertPerson(rootNode, null);
    console.log("Migration complete!");
    alert("Migration to Supabase complete!");
};
