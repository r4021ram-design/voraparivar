import { describe, it, expect } from 'vitest';
import {
    mapPersonRowToNode,
    mapTreeNodeToRow,
    buildTreeFromRows,
    flattenTreeToRows,
} from '../../services/treeMapper';
import type { Person } from '../../../../types/person';
import type { PersonRow } from '../../../../types/db';

const sampleRow: PersonRow = {
    id: 'p1',
    parent_id: null,
    name: 'Test Person',
    gender: 'MALE',
    relation: 'Root',
    generation: 1,
    bio: 'A bio',
    occupation: 'Engineer',
    dob: '1990-01-01',
    dod: null,
    phone: '123456',
    spouse_name: 'Spouse',
    spouse_occupation: 'Doctor',
    spouse_phone: '789012',
    spouse_dob: '1992-05-15',
    spouse_dod: null,
    photo_url: 'https://example.com/photo.jpg',
    spouse_photo_url: 'https://example.com/spouse.jpg',
    anniversary_date: '2015-03-20',
    location_name: 'Mumbai',
    location_lat: 19.076,
    location_lng: 72.877,
    translations: { HI: { name: 'टेस्ट' } },
    sort_order: 1,
};

describe('mapPersonRowToNode', () => {
    it('maps all fields from DB row to Person node', () => {
        const node = mapPersonRowToNode(sampleRow);
        expect(node.id).toBe('p1');
        expect(node.name).toBe('Test Person');
        expect(node.photoUrl).toBe('https://example.com/photo.jpg');
        expect(node.spousePhotoUrl).toBe('https://example.com/spouse.jpg');
        expect(node.anniversaryDate).toBe('2015-03-20');
        expect(node.location?.name).toBe('Mumbai');
        expect(node.location?.lat).toBe(19.076);
        expect(node.translations?.HI?.name).toBe('टेस्ट');
        expect(node.sort_order).toBe(1);
    });

    it('converts null fields to undefined', () => {
        const row: PersonRow = { id: 'p2', parent_id: null, name: 'Minimal' };
        const node = mapPersonRowToNode(row);
        expect(node.bio).toBeUndefined();
        expect(node.photoUrl).toBeUndefined();
        expect(node.location).toBeUndefined();
    });
});

describe('mapTreeNodeToRow', () => {
    it('maps Person node back to DB row', () => {
        const node = mapPersonRowToNode(sampleRow);
        const row = mapTreeNodeToRow({ ...node, children: [] }, null);
        expect(row.id).toBe('p1');
        expect(row.photo_url).toBe('https://example.com/photo.jpg');
        expect(row.spouse_photo_url).toBe('https://example.com/spouse.jpg');
        expect(row.anniversary_date).toBe('2015-03-20');
        expect(row.parent_id).toBeNull();
    });
});

describe('buildTreeFromRows', () => {
    it('builds a tree from flat rows', () => {
        const rows: PersonRow[] = [
            { id: 'root', parent_id: null, name: 'Root' },
            { id: 'c1', parent_id: 'root', name: 'Child 1' },
            { id: 'c2', parent_id: 'root', name: 'Child 2' },
            { id: 'gc1', parent_id: 'c1', name: 'Grandchild' },
        ];
        const tree = buildTreeFromRows(rows);
        expect(tree).not.toBeNull();
        expect(tree!.children.length).toBe(2);
        expect(tree!.children[0].children.length).toBe(1);
        expect(tree!.children[0].children[0].name).toBe('Grandchild');
    });

    it('returns null for empty rows', () => {
        expect(buildTreeFromRows([])).toBeNull();
    });
});

describe('flattenTreeToRows → buildTreeFromRows (round-trip)', () => {
    it('preserves tree structure through flatten → build cycle', () => {
        const original: Person = {
            id: 'root', name: 'Root', generation: 1, children: [
                { id: 'c1', name: 'Child 1', generation: 2, children: [] },
                { id: 'c2', name: 'Child 2', generation: 2, children: [
                    { id: 'gc1', name: 'Grandchild', generation: 3, children: [] },
                ] },
            ],
        };

        const rows = flattenTreeToRows(original);
        expect(rows.length).toBe(4);

        const rebuilt = buildTreeFromRows(rows);
        expect(rebuilt!.id).toBe('root');
        expect(rebuilt!.children.length).toBe(2);
        expect(rebuilt!.children[1].children[0].name).toBe('Grandchild');
    });
});
