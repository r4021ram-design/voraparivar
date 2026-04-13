/**
 * Typed payloads for React Flow nodes and edges used in the family tree.
 */

import type { Node } from 'reactflow';
import type { Person } from '../../types/person';
import type { Language } from '../../i18n';
import type { Theme, FontScale } from '../../types/ui';

/** Data payload passed to each FamilyNode component. */
export interface FamilyNodeData {
    person: Person;
    childOrder?: number;
    hasSiblings?: boolean;

    // Callbacks (undefined = action not allowed for this user role)
    onEdit?: (person: Person) => void;
    onAddChild?: (parentId: string, type: 'son' | 'daughter') => void;
    onToggleExpand?: (personId: string) => void;
    onDelete?: (personId: string) => void;
    onAddParent?: () => void;
    onViewDetails?: (person: Person) => void;

    // UI settings
    language: Language;
    theme: Theme;
    fontScale: FontScale;
    isPrivacyMode: boolean;
    isHighlighted: boolean;
}

/** Strongly typed FamilyTree node. */
export type FamilyTreeNode = Node<FamilyNodeData>;
