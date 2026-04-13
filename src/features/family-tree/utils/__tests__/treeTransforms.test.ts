import { describe, it, expect } from 'vitest';
import {
    findLineage,
    updatePersonInTree,
    addChildToTree,
    deletePersonFromTree,
    togglePersonCollapse,
    addParentToTree,
    sortChildren,
} from '../treeTransforms';
import type { Person } from '../../../../types/person';

// Helpers
const makePerson = (id: string, name: string, children: Person[] = []): Person => ({
    id, name, generation: 1, children,
});

const sampleTree: Person = makePerson('root', 'Grandpa', [
    makePerson('c1', 'Father', [
        makePerson('gc1', 'Son'),
        makePerson('gc2', 'Daughter'),
    ]),
    makePerson('c2', 'Uncle'),
]);

describe('findLineage', () => {
    it('returns path to root', () => {
        expect(findLineage(sampleTree, 'root')).toEqual(['root']);
    });

    it('returns full path to deeply nested node', () => {
        expect(findLineage(sampleTree, 'gc2')).toEqual(['root', 'c1', 'gc2']);
    });

    it('returns null for missing node', () => {
        expect(findLineage(sampleTree, 'nonexistent')).toBeNull();
    });
});

describe('updatePersonInTree', () => {
    it('updates matching node while preserving children', () => {
        const updated: Person = { ...sampleTree.children[0], name: 'Papa' };
        const result = updatePersonInTree(sampleTree, updated);
        expect(result.children[0].name).toBe('Papa');
        expect(result.children[0].children.length).toBe(2); // children preserved
    });

    it('does nothing if person not found', () => {
        const fake: Person = makePerson('fake', 'Nobody');
        const result = updatePersonInTree(sampleTree, fake);
        expect(result).toEqual(sampleTree);
    });
});

describe('addChildToTree', () => {
    it('adds child to the correct parent', () => {
        const newChild = makePerson('new1', 'New Kid');
        const result = addChildToTree(sampleTree, 'c2', newChild);
        expect(result.children[1].children.length).toBe(1);
        expect(result.children[1].children[0].name).toBe('New Kid');
    });

    it('does not mutate the original tree', () => {
        const newChild = makePerson('new2', 'Another Kid');
        addChildToTree(sampleTree, 'c1', newChild);
        expect(sampleTree.children[0].children.length).toBe(2); // unchanged
    });
});

describe('deletePersonFromTree', () => {
    it('deletes a leaf node', () => {
        const result = deletePersonFromTree(sampleTree, 'gc1');
        expect(result!.children[0].children.length).toBe(1);
        expect(result!.children[0].children[0].id).toBe('gc2');
    });

    it('deletes a subtree', () => {
        const result = deletePersonFromTree(sampleTree, 'c1');
        expect(result!.children.length).toBe(1);
        expect(result!.children[0].id).toBe('c2');
    });

    it('returns null when deleting root', () => {
        const result = deletePersonFromTree(sampleTree, 'root');
        expect(result).toBeNull();
    });
});

describe('togglePersonCollapse', () => {
    it('toggles isCollapsed from undefined to true', () => {
        const result = togglePersonCollapse(sampleTree, 'c1');
        expect(result.children[0].isCollapsed).toBe(true);
    });

    it('toggles isCollapsed from true to false', () => {
        const collapsed = togglePersonCollapse(sampleTree, 'c1');
        const expanded = togglePersonCollapse(collapsed, 'c1');
        expect(expanded.children[0].isCollapsed).toBe(false);
    });
});

describe('addParentToTree', () => {
    it('wraps root in a new parent', () => {
        const newRoot = makePerson('ancestor', 'Great Grandpa');
        const result = addParentToTree(sampleTree, newRoot);
        expect(result.id).toBe('ancestor');
        expect(result.children[0].id).toBe('root');
    });
});

describe('sortChildren', () => {
    it('sorts by sort_order when available', () => {
        const children: Person[] = [
            { ...makePerson('a', 'A'), sort_order: 3 },
            { ...makePerson('b', 'B'), sort_order: 1 },
            { ...makePerson('c', 'C'), sort_order: 2 },
        ];
        const sorted = sortChildren(children);
        expect(sorted.map(c => c.id)).toEqual(['b', 'c', 'a']);
    });

    it('sorts by dateOfBirth as fallback', () => {
        const children: Person[] = [
            { ...makePerson('a', 'A'), dateOfBirth: '2000-01-01' },
            { ...makePerson('b', 'B'), dateOfBirth: '1990-01-01' },
        ];
        const sorted = sortChildren(children);
        expect(sorted.map(c => c.id)).toEqual(['b', 'a']);
    });

    it('does not mutate the original array', () => {
        const children: Person[] = [
            { ...makePerson('a', 'A'), sort_order: 2 },
            { ...makePerson('b', 'B'), sort_order: 1 },
        ];
        sortChildren(children);
        expect(children[0].id).toBe('a'); // unchanged
    });
});
