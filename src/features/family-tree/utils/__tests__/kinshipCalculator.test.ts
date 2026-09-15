import { describe, it, expect } from 'vitest';
import { calculateKinship } from '../kinshipCalculator';
import type { Person } from '../../../../types/person';

const makePerson = (id: string, name: string, gender: 'MALE' | 'FEMALE' = 'MALE', children: Person[] = [], generation = 1): Person => ({
    id,
    name,
    gender,
    generation,
    children,
});

// Setup a 3-generation family tree:
// Root (Grandpa)
// ├── c1 (Father)
// │   ├── gc1 (Son)
// │   └── gc2 (Daughter - Female)
// └── c2 (Uncle)
//     └── gc3 (Cousin)
const testTree: Person = makePerson('root', 'Grandpa', 'MALE', [
    makePerson('c1', 'Father', 'MALE', [
        makePerson('gc1', 'Son', 'MALE', [], 3),
        makePerson('gc2', 'Daughter', 'FEMALE', [], 3),
    ], 2),
    makePerson('c2', 'Uncle', 'MALE', [
        makePerson('gc3', 'Cousin', 'MALE', [], 3),
    ], 2),
], 1);

describe('calculateKinship', () => {
    it('returns Self when both IDs are the same', () => {
        const result = calculateKinship(testTree, 'gc1', 'gc1');
        expect(result).not.toBeNull();
        expect(result?.relationEN).toBe('Self');
        expect(result?.relationHI).toBe('स्वयं');
    });

    it('identifies parent and child correctly', () => {
        // Son (gc1) asking about Father (c1)
        const parentResult = calculateKinship(testTree, 'gc1', 'c1');
        expect(parentResult?.relationEN).toBe('Father');
        expect(parentResult?.relationHI).toBe('पिता');

        // Father (c1) asking about Son (gc1)
        const childResult = calculateKinship(testTree, 'c1', 'gc1');
        expect(childResult?.relationEN).toBe('Son');
        expect(childResult?.relationHI).toBe('पुत्र (बेटा)');

        // Father (c1) asking about Daughter (gc2)
        const daughterResult = calculateKinship(testTree, 'c1', 'gc2');
        expect(daughterResult?.relationEN).toBe('Daughter');
        expect(daughterResult?.relationHI).toBe('पुत्री (बेटी)');
    });

    it('identifies siblings correctly', () => {
        // Son (gc1) asking about Sister (gc2)
        const siblingResult = calculateKinship(testTree, 'gc1', 'gc2');
        expect(siblingResult?.relationEN).toBe('Sister');
        expect(siblingResult?.relationHI).toBe('बहन');
    });

    it('identifies uncle and nephew correctly', () => {
        // Nephew (gc1) asking about Uncle (c2)
        const uncleResult = calculateKinship(testTree, 'gc1', 'c2');
        expect(uncleResult?.relationEN).toBe('Uncle');
        expect(uncleResult?.relationHI).toBe('चाचा / ताऊ');

        // Uncle (c2) asking about Nephew (gc1)
        const nephewResult = calculateKinship(testTree, 'c2', 'gc1');
        expect(nephewResult?.relationEN).toBe('Nephew');
        expect(nephewResult?.relationHI).toBe('भतीजा');
    });

    it('identifies first cousins correctly', () => {
        const cousinResult = calculateKinship(testTree, 'gc1', 'gc3');
        expect(cousinResult?.relationEN).toBe('First Cousin (Brother)');
        expect(cousinResult?.relationHI).toBe('चचेरा भाई');
        expect(cousinResult?.relationGU).toBe('પિતરાઈ ભાઈ');
    });

    it('identifies grandfather and grandchild', () => {
        const grandResult = calculateKinship(testTree, 'gc1', 'root');
        expect(grandResult?.relationEN).toBe('Grandfather');
        expect(grandResult?.relationHI).toBe('दादा');

        const grandsonResult = calculateKinship(testTree, 'root', 'gc1');
        expect(grandsonResult?.relationEN).toBe('Grandson');
        expect(grandsonResult?.relationHI).toBe('पोता');
    });

    it('provides full connecting path', () => {
        // Path from gc1 to gc3: gc1 -> c1 -> root -> c2 -> gc3
        const result = calculateKinship(testTree, 'gc1', 'gc3');
        expect(result?.path).toEqual(['gc1', 'c1', 'root', 'c2', 'gc3']);
    });
});
