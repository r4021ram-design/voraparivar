/**
 * Tree Mapper — centralizes conversion between DB rows (PersonRow) and domain model (Person).
 *
 * Every place that reads from or writes to the database should go through these functions
 * to guarantee field coverage and eliminate duplication.
 */

import type { Person } from '../../../types/person';
import type { PersonRow } from '../../../types/db';

// ────────────────────────────────────────────
// Single-row conversions
// ────────────────────────────────────────────

/** Convert a single Supabase row into a Person node (without children). */
export function mapPersonRowToNode(row: PersonRow): Omit<Person, 'children'> {
    return {
        id: row.id,
        name: row.name,
        gender: row.gender,
        relation: row.relation ?? undefined,
        generation: row.generation ?? 1,
        bio: row.bio ?? undefined,
        occupation: row.occupation ?? undefined,
        dateOfBirth: row.dob ?? undefined,
        dateOfDeath: row.dod ?? undefined,
        phoneNumber: row.phone ?? undefined,
        spouse: row.spouse_name ?? undefined,
        spouseOccupation: row.spouse_occupation ?? undefined,
        spousePhoneNumber: row.spouse_phone ?? undefined,
        spouseDateOfBirth: row.spouse_dob ?? undefined,
        spouseDateOfDeath: row.spouse_dod ?? undefined,
        photoUrl: row.photo_url ?? undefined,
        spousePhotoUrl: row.spouse_photo_url ?? undefined,
        anniversaryDate: row.anniversary_date ?? undefined,
        location: row.location_name
            ? { name: row.location_name, lat: row.location_lat ?? undefined, lng: row.location_lng ?? undefined }
            : undefined,
        translations: row.translations ?? undefined,
        sort_order: row.sort_order ?? undefined,
        isCollapsed: false,
    };
}

/** Convert a Person node into a flat Supabase row. */
export function mapTreeNodeToRow(node: Person, parentId: string | null): PersonRow {
    return {
        id: node.id,
        parent_id: parentId,
        name: node.name,
        gender: node.gender,
        relation: node.relation ?? null,
        generation: node.generation ?? 1,
        bio: node.bio ?? null,
        occupation: node.occupation ?? null,
        dob: node.dateOfBirth ?? null,
        dod: node.dateOfDeath ?? null,
        phone: node.phoneNumber ?? null,
        spouse_name: node.spouse ?? null,
        spouse_occupation: node.spouseOccupation ?? null,
        spouse_phone: node.spousePhoneNumber ?? null,
        spouse_dob: node.spouseDateOfBirth ?? null,
        spouse_dod: node.spouseDateOfDeath ?? null,
        photo_url: node.photoUrl ?? null,
        spouse_photo_url: node.spousePhotoUrl ?? null,
        anniversary_date: node.anniversaryDate ?? null,
        location_name: node.location?.name ?? null,
        location_lat: node.location?.lat ?? null,
        location_lng: node.location?.lng ?? null,
        translations: node.translations ?? null,
        sort_order: node.sort_order ?? null,
    };
}

// ────────────────────────────────────────────
// Bulk conversions
// ────────────────────────────────────────────

/** Build a recursive Person tree from a flat array of DB rows. */
export function buildTreeFromRows(rows: PersonRow[]): Person | null {
    const root = rows.find(r => r.parent_id === null);
    if (!root) return null;

    const buildChildren = (parentId: string): Person[] => {
        return rows
            .filter(r => r.parent_id === parentId)
            .map(r => ({
                ...mapPersonRowToNode(r),
                children: buildChildren(r.id),
            }));
    };

    return {
        ...mapPersonRowToNode(root),
        children: buildChildren(root.id),
    };
}

/** Flatten a recursive Person tree into an array of DB rows. */
export function flattenTreeToRows(root: Person, parentId: string | null = null): PersonRow[] {
    const row = mapTreeNodeToRow(root, parentId);
    let rows: PersonRow[] = [row];
    if (root.children) {
        for (const child of root.children) {
            rows = rows.concat(flattenTreeToRows(child, root.id));
        }
    }
    return rows;
}
