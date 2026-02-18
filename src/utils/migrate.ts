import { supabase } from '../lib/supabase';
import type { Person } from '../types';
import { familyTreeData } from '../data';

export const migrateDataToSupabase = async () => {
    console.log("Starting migration...");

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
