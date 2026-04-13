import { describe, it, expect } from 'vitest';
import { validatePerson, hasCircularRef } from '../validateTree';

describe('validatePerson', () => {
    it('validates a correct person tree', () => {
        const tree = { id: 'root', name: 'Test', children: [] };
        const result = validatePerson(tree);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('catches missing id', () => {
        const tree = { name: 'Test', children: [] };
        const result = validatePerson(tree);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("root: missing 'id'");
    });

    it('catches missing name', () => {
        const tree = { id: 'root', children: [] };
        const result = validatePerson(tree);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("root: missing or invalid 'name'");
    });

    it('catches non-array children', () => {
        const tree = { id: 'root', name: 'Test', children: 'not-an-array' };
        const result = validatePerson(tree);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("root: 'children' must be an array");
    });

    it('validates nested children', () => {
        const tree = {
            id: 'root', name: 'Root', children: [
                { id: 'c1', name: 'Child' },  // missing children array is OK
                { id: 'c2' },  // missing name
            ],
        };
        const result = validatePerson(tree);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });

    it('returns error for null input', () => {
        const result = validatePerson(null);
        expect(result.valid).toBe(false);
    });
});

describe('hasCircularRef', () => {
    it('returns null for a clean tree', () => {
        const tree = { id: 'a', children: [{ id: 'b', children: [] }] };
        expect(hasCircularRef(tree)).toBeNull();
    });

    it('returns null for empty tree', () => {
        const tree = { id: 'a' };
        expect(hasCircularRef(tree)).toBeNull();
    });
});
