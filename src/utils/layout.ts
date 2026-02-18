import dagre from 'dagre';
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

    const traverse = (person: Person, depth: number) => {
        // Ensure generation is set for styling, even if missing from data
        const personWithGen = { ...person, generation: depth + 1 };

        initialNodes.push({
            id: person.id,
            type: 'familyNode',
            data: { person: personWithGen },
            position: { x: 0, y: 0 }, // Will be set by dagre
        });

        if (person.children && !person.isCollapsed) {
            person.children.forEach((child) => {
                initialEdges.push({
                    id: `e${person.id}-${child.id}`,
                    source: person.id,
                    target: child.id,
                    type: 'customEdge',
                    animated: false,
                });
                traverse(child, depth + 1);
            });
        }
    };

    traverse(root, 0);
    return getLayoutedElements(initialNodes, initialEdges);
};
