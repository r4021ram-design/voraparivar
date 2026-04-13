import dagre from '@dagrejs/dagre';
import { type Node, type Edge, Position } from 'reactflow';
import type { Person } from '../types';

const nodeWidth = 250;
const nodeHeight = 150;

export const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({ rankdir: 'TB', nodesep: 100, ranksep: 100 }); // Top-to-Bottom

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            targetPosition: Position.Top,
            sourcePosition: Position.Bottom,
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - nodeHeight / 2,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};

export const processTreeToElements = (root: Person) => {
    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];

    const traverse = (person: Person, depth: number, childOrder?: number, hasSiblings?: boolean) => {
        // Ensure generation is set for styling, even if missing from data
        const personWithGen = { ...person, generation: depth + 1 };

        initialNodes.push({
            id: person.id,
            type: 'familyNode',
            data: { 
                person: personWithGen,
                childOrder,
                hasSiblings
            },
            position: { x: 0, y: 0 }, // Will be set by dagre
        });

        if (person.children && !person.isCollapsed) {
            // Sorting children (non-mutating — sort a copy to avoid corrupting tree state):
            // 1. Priority: Manual sort_order (if set)
            // 2. Fallback: dateOfBirth
            const sortedChildren = [...person.children].sort((a, b) => {
                // If both have explicit sort_order, compare them
                if (a.sort_order != null && b.sort_order != null) {
                    return a.sort_order - b.sort_order;
                }
                // If only one has sort_order, it comes first
                if (a.sort_order != null) return -1;
                if (b.sort_order != null) return 1;

                // Fallback to dateOfBirth
                if (a.dateOfBirth && b.dateOfBirth) {
                    return new Date(a.dateOfBirth).getTime() - new Date(b.dateOfBirth).getTime();
                }
                return 0;
            });

            sortedChildren.forEach((child, index) => {
                initialEdges.push({
                    id: `e${person.id}-${child.id}`,
                    source: person.id,
                    target: child.id,
                    type: 'customEdge',
                    animated: false,
                });
                traverse(child, depth + 1, index + 1, sortedChildren.length > 1);
            });
        }
    };

    traverse(root, 0);
    return getLayoutedElements(initialNodes, initialEdges);
};
