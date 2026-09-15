import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const url = 'https://wgpypwqkhbnvcjaqrtqc.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndncHlwd3FraGJudmNqYXFydHFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzOTIwMDAsImV4cCI6MjA4Njk2ODAwMH0.CtntmOricWIJIrRmx7MZqgnPCJ6Iel-VpsjMxUzp9wI';
const supabase = createClient(url, key);

async function sync() {
    console.log('Reading public/vanshavali_edited.json...');
    const raw = JSON.parse(fs.readFileSync('./public/vanshavali_edited.json', 'utf8'));
    const root = raw.tree || raw;

    console.log('Flattening tree...');
    const rows = [];

    function traverse(node, parentId = null) {
        rows.push({
            id: node.id,
            parent_id: parentId,
            name: node.name,
            gender: node.gender,
            relation: node.relation,
            generation: node.generation || 1,
            bio: node.bio || null,
            occupation: node.occupation || null,
            dob: node.dateOfBirth || null,
            dod: node.dateOfDeath || null,
            phone: node.phoneNumber || null,
            spouse_name: node.spouse || null,
            spouse_occupation: node.spouseOccupation || null,
            spouse_phone: node.spousePhoneNumber || null,
            spouse_dob: node.spouseDateOfBirth || null,
            spouse_dod: node.spouseDateOfDeath || null,
            location_name: node.location?.name || null,
            location_lat: node.location?.lat || null,
            location_lng: node.location?.lng || null,
            photo_url: node.photoUrl || null,
            spouse_photo_url: node.spousePhotoUrl || null,
            sort_order: node.sort_order || null,
            translations: node.translations || {}
        });

        if (node.children) {
            node.children.forEach(c => traverse(c, node.id));
        }
    }

    traverse(root, null);
    console.log(`Prepared ${rows.length} records. Starting upsert to Supabase...`);

    // Insert in batches
    const BATCH_SIZE = 25;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const chunk = rows.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('people').upsert(chunk);
        if (error) {
            console.error(`Batch ${i / BATCH_SIZE + 1} failed:`, error.message);
            return;
        }
        console.log(`Uploaded batch ${i / BATCH_SIZE + 1} (${chunk.length} items)...`);
    }

    console.log('✅ All nodes successfully synced to Supabase!');
}

sync();
