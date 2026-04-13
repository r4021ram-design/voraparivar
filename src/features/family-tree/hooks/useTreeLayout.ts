/**
 * Tree layout hook — builds React Flow nodes/edges from tree data,
 * injects callbacks into node payloads, and styles highlighted edges.
 *
 * Extracted from FamilyTreeFlow to isolate graph derivation logic.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useNodesState, useEdgesState, useReactFlow } from 'reactflow';
import type { Person } from '../../../types/person';
import type { Language } from '../../../i18n';
import type { Theme, FontScale } from '../../../types/ui';
import { processTreeToElements } from '../../../utils/layout';

interface UseTreeLayoutOptions {
    userRole: string;
    language: Language;
    theme: Theme;
    fontScale: FontScale;
    isPrivacyMode: boolean;
    highlightedPath: string[];
    selectedNodeId: string | null;
    edgeColor: string;
    edgeWidth: number;

    // Callbacks to inject into nodes
    handleAddChild: (parentId: string, type: 'son' | 'daughter') => void;
    handleDelete: (personId: string) => void;
    handleToggleExpand: (personId: string) => void;
    handleAddParent: () => void;
    onEditPerson: (person: Person) => void;
    onViewDetails: (person: Person) => void;
}

export const useTreeLayout = (options: UseTreeLayoutOptions) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const { fitView } = useReactFlow();

    const {
        userRole, language, theme, fontScale, isPrivacyMode,
        highlightedPath, selectedNodeId, edgeColor, edgeWidth,
        handleAddChild, handleDelete, handleToggleExpand, handleAddParent,
        onEditPerson, onViewDetails,
    } = options;

    const refreshLayout = useCallback((data: Person, skipFitView = false) => {
        const { nodes: initialNodes, edges: initialEdgesRaw } = processTreeToElements(data);

        const canEdit = userRole === 'ADMIN' || userRole === 'STANDARD';
        const isAdmin = userRole === 'ADMIN';

        const nodesWithCallback = initialNodes.map(node => ({
            ...node,
            data: {
                ...node.data,
                onEdit: canEdit ? (p: Person) => onEditPerson(p) : undefined,
                onAddChild: canEdit ? handleAddChild : undefined,
                onToggleExpand: handleToggleExpand,
                onDelete: isAdmin ? handleDelete : undefined,
                onAddParent: isAdmin ? handleAddParent : undefined,
                onViewDetails: (p: Person) => onViewDetails(p),
                language,
                theme,
                fontScale,
                isPrivacyMode,
                isHighlighted: highlightedPath.includes(node.id) || selectedNodeId === node.id,
            },
        }));

        const styledEdges = initialEdgesRaw.map(e => {
            const isHighlighted = highlightedPath.includes(e.source) && highlightedPath.includes(e.target);
            return {
                ...e,
                style: {
                    stroke: isHighlighted ? '#facc15' : edgeColor,
                    strokeWidth: isHighlighted ? edgeWidth + 2 : edgeWidth,
                    opacity: isHighlighted ? 1 : 0.8,
                },
                animated: isHighlighted,
            };
        });

        setNodes(nodesWithCallback);
        setEdges(styledEdges);

        if (!skipFitView) {
            window.requestAnimationFrame(() => {
                fitView({ duration: 800, padding: 0.2 });
            });
        }
    }, [
        setNodes, setEdges, userRole, handleAddChild, handleDelete,
        fitView, language, edgeColor, edgeWidth, theme, fontScale,
        isPrivacyMode, highlightedPath, selectedNodeId,
        handleToggleExpand, handleAddParent, onEditPerson, onViewDetails,
    ]);

    // Ref to allow async callbacks (like toggle-expand) to call latest refreshLayout
    const refreshLayoutRef = useRef<(data: Person) => void>(() => { });
    useEffect(() => {
        refreshLayoutRef.current = refreshLayout;
    }, [refreshLayout]);

    return {
        nodes, edges,
        onNodesChange, onEdgesChange,
        refreshLayout,
        refreshLayoutRef,
    };
};
