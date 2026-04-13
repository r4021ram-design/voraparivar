/**
 * Tree selection and focus hook — manages node selection, lineage highlighting,
 * and camera-focus behavior.
 *
 * Extracted from FamilyTreeFlow to isolate navigation concerns.
 */

import { useState, useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import type { Person } from '../../../types/person';
import { findLineage } from '../utils/treeTransforms';

export const useTreeSelection = (currentData: Person) => {
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [highlightedPath, setHighlightedPath] = useState<string[]>([]);
    const { fitView } = useReactFlow();

    const focusNode = useCallback((nodeId: string) => {
        const lineage = findLineage(currentData, nodeId);
        if (lineage) {
            setHighlightedPath(lineage);
            setSelectedNodeId(nodeId);

            fitView({
                nodes: lineage.map(id => ({ id })),
                duration: 1000,
                padding: 0.3,
            });
        }

        if (window.innerWidth < 640) {
            // Will be handled by the caller (close search sidebar on mobile)
        }
    }, [fitView, currentData]);

    const focusRoot = useCallback(() => {
        focusNode('root');
    }, [focusNode]);

    const clearSelection = useCallback(() => {
        setSelectedNodeId(null);
        setHighlightedPath([]);
    }, []);

    return {
        selectedNodeId,
        highlightedPath,
        focusNode,
        focusRoot,
        clearSelection,
    };
};
