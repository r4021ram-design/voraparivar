import { describe, it, expect } from 'vitest';
import { calculateBotanicalLayout } from '../treeBotanicalLayout';
import type { Person } from '../../../../types/person';

describe('treeBotanicalLayout', () => {
    const sampleTree: Person = {
        id: 'root-1',
        name: 'Dada ji',
        generation: 1,
        gender: 'MALE',
        children: [
            {
                id: 'child-1',
                name: 'Son 1',
                generation: 2,
                gender: 'MALE',
                spouse: 'Daughter-in-law',
                children: [
                    { id: 'gc-1', name: 'Grandson 1', generation: 3, gender: 'MALE', children: [] },
                    { id: 'gc-2', name: 'Granddaughter 1', generation: 3, gender: 'FEMALE', children: [] },
                ],
            },
            {
                id: 'child-2',
                name: 'Son 2',
                generation: 2,
                gender: 'MALE',
                children: [],
            },
        ],
    };

    it('calculates coordinates for all nodes and branches', () => {
        const layout = calculateBotanicalLayout(sampleTree);

        expect(layout.nodes.length).toBe(5);
        expect(layout.branches.length).toBe(4);

        const root = layout.nodes.find(n => n.id === 'root-1');
        expect(root).toBeDefined();
        expect(root?.isRoot).toBe(true);

        const childWithSpouse = layout.nodes.find(n => n.id === 'child-1');
        expect(childWithSpouse?.hasSpouse).toBe(true);
        expect(childWithSpouse?.spouseName).toBe('Daughter-in-law');
    });

    it('generates non-empty cubic bezier paths with proper tapering thickness', () => {
        const layout = calculateBotanicalLayout(sampleTree);

        for (const branch of layout.branches) {
            expect(branch.pathData).toMatch(/^M \d+(\.\d+)? \d+(\.\d+)? C/);
            expect(branch.thickness).toBeGreaterThan(0);
        }

        // Branch from Gen 1 to Gen 2 should be thicker than Gen 2 to Gen 3
        const b1 = layout.branches.find(b => b.sourceId === 'root-1');
        const b2 = layout.branches.find(b => b.sourceId === 'child-1');
        expect(b1!.thickness).toBeGreaterThan(b2!.thickness);
    });

    it('flags highlighted branches when path is provided', () => {
        const highlightedPath = ['root-1', 'child-1', 'gc-1'];
        const layout = calculateBotanicalLayout(sampleTree, highlightedPath);

        const branch1 = layout.branches.find(b => b.sourceId === 'root-1' && b.targetId === 'child-1');
        const branch2 = layout.branches.find(b => b.sourceId === 'child-1' && b.targetId === 'gc-1');
        const branch3 = layout.branches.find(b => b.sourceId === 'root-1' && b.targetId === 'child-2');

        expect(branch1?.isHighlighted).toBe(true);
        expect(branch2?.isHighlighted).toBe(true);
        expect(branch3?.isHighlighted).toBe(false);
    });
});
