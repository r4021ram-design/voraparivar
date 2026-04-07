import type { Person } from './types';
import { validatePerson } from './utils/validateTree';

const addGenerations = (node: any, gen: number): Person => {
    return {
        ...node,
        generation: node.generation != null ? node.generation : gen,
        children: (node.children || []).map((child: any) => addGenerations(child, gen + 1))
    };
};

// Minimal placeholder root used while JSON loads asynchronously
export const EMPTY_ROOT: Person = {
    id: 'root',
    name: 'Loading…',
    generation: 1,
    gender: 'MALE',
    children: [],
};

/**
 * Fetch the family-tree JSON at runtime from /public instead of bundling it.
 * This eliminates the 4 MB chunk from the JS bundle.
 */
export async function loadFamilyTreeData(): Promise<Person> {
    const res = await fetch('/vanshavali_edited.json');
    if (!res.ok) throw new Error(`Failed to load family data: ${res.status}`);
    const json = await res.json();
    const rawData = json.tree || json;
    
    // Validate the tree structure
    const validation = validatePerson(rawData);
    if (!validation.valid) {
        throw new Error(`Data validation failed:\n${validation.errors.join('\n')}`);
    }
    
    return addGenerations(rawData, 1);
}
