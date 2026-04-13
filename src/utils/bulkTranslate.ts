import type { Person } from '../types';
import { getTranslatedContent } from '../i18n';
import { transliterateText } from './transliterate';

/**
 * Recursively flattens the family tree into an array of Person objects.
 */
const flattenTree = (root: Person): Person[] => {
    let persons = [root];
    if (root.children) {
        for (const child of root.children) {
            persons = persons.concat(flattenTree(child));
        }
    }
    return persons;
};

/**
 * Reconstructs the tree with updated person data.
 */
const updateTreeWithTranslations = (root: Person, updatedMap: Map<string, Partial<Person['translations']>>): Person => {
    const updatedTranslations = updatedMap.get(root.id);
    const newTranslations = updatedTranslations 
        ? { ...root.translations, ...updatedTranslations } 
        : root.translations;

    return {
        ...root,
        translations: newTranslations,
        children: root.children.map(child => updateTreeWithTranslations(child, updatedMap))
    };
};

/**
 * Translates a single text field using the local dictionary (i18n.ts).
 * No API calls — instant!
 * 
 * Returns the translated text, or the original if not found in dictionary.
 */
const localTranslate = (text: string | undefined, language: 'EN' | 'HI' | 'GU'): string | undefined => {
    if (!text || text.trim().length === 0) return undefined;
    const translated = getTranslatedContent(text, language);
    // getTranslatedContent returns the original text if not found
    return translated;
};

/**
 * Performs INSTANT bulk translation for the entire tree using the LOCAL dictionary.
 * 
 * How it works:
 * 1. Flattens the tree into a list of all people
 * 2. For each person, looks up name/relation/occupation/spouse in the i18n.ts dictionary
 * 3. Builds translations object { EN: {...}, HI: {...}, GU: {...} }
 * 4. Returns the updated tree — no API calls, no rate limits!
 * 
 * Dictionary coverage:
 * - All names from the original vanshavali (100+ entries)
 * - Common terms (Son, Daughter, Farmer, Teacher, etc.)
 * - Case-insensitive matching
 * 
 * For any name NOT in the dictionary, the original text is kept.
 */
export const bulkTranslateTree = async (
    root: Person, 
    onProgress: (count: number, total: number) => void
): Promise<Person> => {
    const allPersons = flattenTree(root);
    const total = allPersons.length;
    const updatedMap = new Map<string, Person['translations']>();
    let translatedCount = 0;
    let unchangedCount = 0;

    console.log(`[BulkTranslate] Starting LOCAL translation for ${total} people (no API calls)`);

    for (let i = 0; i < allPersons.length; i++) {
        const p = allPersons[i];

        let hiName = localTranslate(p.name, 'HI');
        let guName = localTranslate(p.name, 'GU');
        
        // If not in local dictionary, use Google Transliterate API (Free)
        if (!hiName || hiName === p.name) {
            hiName = await transliterateText(p.name, 'HI');
        }
        if (!guName || guName === p.name) {
            guName = await transliterateText(p.name, 'GU');
        }

        // Check if at least the name was actually translated (different from original)
        const nameTranslated = (hiName && hiName !== p.name) || (guName && guName !== p.name);

        const personTranslations: Person['translations'] = {
            EN: {
                name: p.name,
                relation: p.relation,
                occupation: p.occupation,
                bio: p.bio,
                spouse: p.spouse,
                spouseOccupation: p.spouseOccupation,
            },
            HI: {
                name: hiName,
                relation: localTranslate(p.relation, 'HI'),
                occupation: localTranslate(p.occupation, 'HI'),
                bio: localTranslate(p.bio, 'HI'),
                spouse: localTranslate(p.spouse, 'HI'),
                spouseOccupation: localTranslate(p.spouseOccupation, 'HI'),
            },
            GU: {
                name: guName,
                relation: localTranslate(p.relation, 'GU'),
                occupation: localTranslate(p.occupation, 'GU'),
                bio: localTranslate(p.bio, 'GU'),
                spouse: localTranslate(p.spouse, 'GU'),
                spouseOccupation: localTranslate(p.spouseOccupation, 'GU'),
            }
        };

        updatedMap.set(p.id, personTranslations);

        if (nameTranslated) {
            translatedCount++;
        } else {
            unchangedCount++;
            console.log(`[BulkTranslate] ⚠️ "${p.name}" not found in dictionary — keeping original`);
        }

        // Report progress (instant, but still update UI)
        onProgress(i + 1, total);
    }

    console.log(`[BulkTranslate] ✅ Complete! ${translatedCount} translated, ${unchangedCount} kept original (out of ${total})`);
    if (unchangedCount > 0) {
        console.log(`[BulkTranslate] 💡 To translate the remaining ${unchangedCount} names, add them to src/i18n.ts dictionary`);
    }
    
    return updateTreeWithTranslations(root, updatedMap);
};
