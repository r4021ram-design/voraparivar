// Validation logic for Person hierarchy

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

export function validatePerson(node: any, path: string = 'root'): ValidationResult {
    const errors: string[] = [];

    if (!node) {
        return { valid: false, errors: [`${path}: Node is null or undefined`] };
    }

    if (!node.id) errors.push(`${path}: missing 'id'`);
    if (!node.name || typeof node.name !== 'string') errors.push(`${path}: missing or invalid 'name'`);
    if (node.children && !Array.isArray(node.children)) {
        errors.push(`${path}: 'children' must be an array`);
    }
    
    // Check circular references within the data structure itself
    const res = hasCircularRef(node);
    if (res) {
        errors.push(`${path}: Circular dependency detected involving node '${res}'`);
    }

    // Recursive validate children
    if (Array.isArray(node.children)) {
        node.children.forEach((child: any, i: number) => {
            const childResult = validatePerson(child, `${path}.children[${i}]`);
            errors.push(...childResult.errors);
        });
    }

    return { valid: errors.length === 0, errors };
}

// Check for circular dependencies in any tree structure.
// Returns the ID of the node causing the cycle, or null if no cycle exists.
export function hasCircularRef(node: any, visited = new Set<string>()): string | null {
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
