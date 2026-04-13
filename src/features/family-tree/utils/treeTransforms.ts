/**
 * Pure tree transform utilities.
 *
 * Every function here is a pure function: given a tree, return a new tree.
 * No side-effects, no React hooks, no database calls.
 */

import type { Person } from '../../../types/person';

/** Find the lineage (ancestor path) from root to a target node. */
export function findLineage(root: Person, targetId: string, path: string[] = []): string[] | null {
    if (root.id === targetId) return [...path, root.id];
    if (root.children) {
        for (const child of root.children) {
            const result = findLineage(child, targetId, [...path, root.id]);
            if (result) return result;
        }
    }
    return null;
}

/** Immutably update a single person in the tree by ID. */
export function updatePersonInTree(root: Person, updatedPerson: Person): Person {
    if (root.id === updatedPerson.id) {
        return { ...updatedPerson, children: root.children };
    }
    if (root.children) {
        return {
            ...root,
            children: root.children.map(child => updatePersonInTree(child, updatedPerson)),
        };
    }
    return root;
}

/** Add a child to a specific parent in the tree. Returns the new tree. */
export function addChildToTree(root: Person, parentId: string, child: Person): Person {
    if (root.id === parentId) {
        return { ...root, children: [...root.children, child] };
    }
    if (root.children) {
        return {
            ...root,
            children: root.children.map(c => addChildToTree(c, parentId, child)),
        };
    }
    return root;
}

/** Delete a person (and their subtree) from the tree by ID. Returns new tree or null if root was deleted. */
export function deletePersonFromTree(root: Person, personId: string): Person | null {
    if (root.id === personId) return null;
    if (root.children) {
        const newChildren = root.children
            .map(child => deletePersonFromTree(child, personId))
            .filter((child): child is Person => child !== null);
        return { ...root, children: newChildren };
    }
    return root;
}

/** Toggle collapse/expand for a specific person. */
export function togglePersonCollapse(root: Person, personId: string): Person {
    if (root.id === personId) {
        return { ...root, isCollapsed: !root.isCollapsed };
    }
    if (root.children) {
        return {
            ...root,
            children: root.children.map(child => togglePersonCollapse(child, personId)),
        };
    }
    return root;
}

/** Wrap the current root in a new parent node. */
export function addParentToTree(currentRoot: Person, newRoot: Person): Person {
    return {
        ...newRoot,
        children: [{ ...currentRoot }],
    };
}

/** Sort children by sort_order (priority) then dateOfBirth (fallback). Non-mutating. */
export function sortChildren(children: Person[]): Person[] {
    return [...children].sort((a, b) => {
        if (a.sort_order != null && b.sort_order != null) {
            return a.sort_order - b.sort_order;
        }
        if (a.sort_order != null) return -1;
        if (b.sort_order != null) return 1;

        if (a.dateOfBirth && b.dateOfBirth) {
            return new Date(a.dateOfBirth).getTime() - new Date(b.dateOfBirth).getTime();
        }
        return 0;
    });
}
