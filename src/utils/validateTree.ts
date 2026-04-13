// Validation logic for Person hierarchy

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

interface TreeNode {
    id?: string;
    name?: string;
    children?: TreeNode[];
    [key: string]: unknown;
}

export function validatePerson(node: unknown, path: string = 'root'): ValidationResult {
    const errors: string[] = [];

    if (!node || typeof node !== 'object') {
        return { valid: false, errors: [`${path}: Node is null or undefined`] };
    }

    const tree = node as TreeNode;

    if (!tree.id) errors.push(`${path}: missing 'id'`);
    if (!tree.name || typeof tree.name !== 'string') errors.push(`${path}: missing or invalid 'name'`);
    if (tree.children && !Array.isArray(tree.children)) {
        errors.push(`${path}: 'children' must be an array`);
    }
    
    // Check circular references within the data structure itself
    const res = hasCircularRef(tree);
    if (res) {
        errors.push(`${path}: Circular dependency detected involving node '${res}'`);
    }

    // Recursive validate children
    if (Array.isArray(tree.children)) {
        tree.children.forEach((child: TreeNode, i: number) => {
            const childResult = validatePerson(child, `${path}.children[${i}]`);
            errors.push(...childResult.errors);
        });
    }

    return { valid: errors.length === 0, errors };
}

// Check for circular dependencies in any tree structure.
// Returns the ID of the node causing the cycle, or null if no cycle exists.
export function hasCircularRef(node: TreeNode, visited = new Set<string>()): string | null {
    if (!node) return null;
    if (node.id && visited.has(node.id)) return node.id;
    
    const newVisited = new Set(visited);
    if (node.id) newVisited.add(node.id);
    
    if (Array.isArray(node.children)) {
        for (const child of node.children) {
            const cycleId = hasCircularRef(child, newVisited);
            if (cycleId) return cycleId;
        }
    }
    return null;
}
