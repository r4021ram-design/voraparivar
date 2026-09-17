/**
 * Botanical Tree Layout Engine
 *
 * Computes organic coordinate positions, cubic Bezier branch paths,
 * trunk architecture, and leaf orientations for the Vatvriksha view.
 *
 * Root ancestor sits at the lower center trunk, with generations branching
 * organically upward and outward into a majestic banyan canopy.
 */

import type { Person } from '../../../types/person';

export interface BotanicalNode {
    id: string;
    person: Person;
    x: number;
    y: number;
    generation: number;
    angle: number; // Angle of leaf stem in degrees
    isRoot: boolean;
    hasSpouse: boolean;
    spouseName?: string;
    spousePhotoUrl?: string;
    isDeceased: boolean;
    isSpouseDeceased: boolean;
    childrenCount: number;
}

export interface BotanicalBranch {
    id: string;
    sourceId: string;
    targetId: string;
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
    pathData: string; // SVG cubic bezier path
    thickness: number;
    generation: number;
    isHighlighted: boolean;
}

export interface BotanicalTreeLayout {
    nodes: BotanicalNode[];
    branches: BotanicalBranch[];
    bounds: {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
        width: number;
        height: number;
    };
    trunk: {
        baseX: number;
        baseY: number;
        topX: number;
        topY: number;
        rootNodeId: string;
    };
}

interface LayoutNodeInternal {
    person: Person;
    generation: number;
    leafCount: number;
    x: number;
    y: number;
    children: LayoutNodeInternal[];
}

const LEVEL_HEIGHT = 160; // Vertical distance per generation
const LEAF_HORIZONTAL_SPACING = 140; // Minimum horizontal gap per leaf node

/**
 * Counts total leaf descendants to allocate proportionate horizontal spread.
 */
function computeLeafCounts(node: Person, generation = 1): LayoutNodeInternal {
    const children = (node.children && node.children.length > 0)
        ? node.children.map(c => computeLeafCounts(c, generation + 1))
        : [];

    const leafCount = children.length === 0
        ? 1
        : children.reduce((sum, c) => sum + c.leafCount, 0);

    return {
        person: node,
        generation,
        leafCount,
        x: 0,
        y: 0,
        children,
    };
}

/**
 * Assigns X coordinates organically based on cumulative subtree leaf spans.
 */
function assignCoordinates(
    node: LayoutNodeInternal,
    leftBoundary: number,
    treeHeight: number
): number {
    const totalWidth = node.leafCount * LEAF_HORIZONTAL_SPACING;

    // Y grows upward: root is near the base (bottom), higher generations grow upward (smaller Y)
    node.y = treeHeight - (node.generation - 1) * LEVEL_HEIGHT;

    if (node.children.length === 0) {
        node.x = leftBoundary + totalWidth / 2;
        return leftBoundary + totalWidth;
    }

    let currentLeft = leftBoundary;
    const childMidpoints: number[] = [];

    for (const child of node.children) {
        currentLeft = assignCoordinates(child, currentLeft, treeHeight);
        childMidpoints.push(child.x);
    }

    // Center parent over its children
    node.x = (childMidpoints[0] + childMidpoints[childMidpoints.length - 1]) / 2;

    return leftBoundary + totalWidth;
}

/**
 * Creates natural organic wooden curve connecting parent branch to child branch.
 */
function createOrganicBranchPath(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    generation: number = 1
): string {
    const deltaX = endX - startX;
    const deltaY = endY - startY; // negative since growing upwards

    // Organic wobble modulated by branch generation for natural bark feel
    const wobbleScale = Math.max(5, 14 - generation * 2);
    const wobble = Math.sin(startX * 0.05 + endX * 0.05) * wobbleScale;

    // Control point 1: rises from parent branch
    const cp1X = startX + deltaX * 0.15 + wobble;
    const cp1Y = startY + deltaY * 0.45;

    // Control point 2: gracefully eases into child position
    const cp2X = endX - deltaX * 0.15 - wobble * 0.5;
    const cp2Y = startY + deltaY * 0.85;

    return `M ${startX.toFixed(1)} ${startY.toFixed(1)} C ${cp1X.toFixed(1)} ${cp1Y.toFixed(1)}, ${cp2X.toFixed(1)} ${cp2Y.toFixed(1)}, ${endX.toFixed(1)} ${endY.toFixed(1)}`;
}

/**
 * Computes branch thickness tapering from trunk to outer foliage.
 */
function getBranchThickness(generation: number): number {
    switch (generation) {
        case 1: return 28; // Grand primary bough
        case 2: return 18; // Secondary boughs
        case 3: return 12; // Tertiary branches
        case 4: return 8;  // Intermediate twigs
        default: return 5; // Delicate outer twigs
    }
}

/**
 * Main layout calculation function.
 */
export function calculateBotanicalLayout(
    rootPerson: Person,
    highlightedPath: string[] = []
): BotanicalTreeLayout {
    // 1. Compute tree depth and leaf spans
    const internalRoot = computeLeafCounts(rootPerson, 1);

    // Find max generation
    let maxGen = 1;
    function findMaxGen(n: LayoutNodeInternal) {
        if (n.generation > maxGen) maxGen = n.generation;
        n.children.forEach(findMaxGen);
    }
    findMaxGen(internalRoot);

    const totalTreeHeight = maxGen * LEVEL_HEIGHT + 240; // extra padding for roots and crown

    // 2. Position all nodes
    assignCoordinates(internalRoot, 100, totalTreeHeight);

    const nodes: BotanicalNode[] = [];
    const branches: BotanicalBranch[] = [];

    // 3. Flatten into botanical domain models
    function traverse(node: LayoutNodeInternal, parent?: LayoutNodeInternal) {
        // Calculate angle of leaf stem based on position relative to parent
        let angle = 0;
        if (parent) {
            const dx = node.x - parent.x;
            const dy = node.y - parent.y;
            angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
        }

        const isHighlighted = Boolean(
            parent &&
            highlightedPath.includes(parent.person.id) &&
            highlightedPath.includes(node.person.id)
        );

        nodes.push({
            id: node.person.id,
            person: node.person,
            x: node.x,
            y: node.y,
            generation: node.generation,
            angle,
            isRoot: node.generation === 1,
            hasSpouse: Boolean(node.person.spouse && node.person.spouse.trim()),
            spouseName: node.person.spouse,
            spousePhotoUrl: node.person.spousePhotoUrl,
            isDeceased: Boolean(node.person.dateOfDeath),
            isSpouseDeceased: Boolean(node.person.spouseDateOfDeath),
            childrenCount: node.person.children ? node.person.children.length : 0,
        });

        if (parent) {
            branches.push({
                id: `branch-${parent.person.id}-${node.person.id}`,
                sourceId: parent.person.id,
                targetId: node.person.id,
                sourceX: parent.x,
                sourceY: parent.y,
                targetX: node.x,
                targetY: node.y,
                pathData: createOrganicBranchPath(parent.x, parent.y, node.x, node.y, parent.generation),
                thickness: getBranchThickness(parent.generation),
                generation: parent.generation,
                isHighlighted,
            });
        }

        node.children.forEach(c => traverse(c, node));
    }

    traverse(internalRoot);

    // 4. Calculate bounding box
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const n of nodes) {
        if (n.x < minX) minX = n.x;
        if (n.x > maxX) maxX = n.x;
        if (n.y < minY) minY = n.y;
        if (n.y > maxY) maxY = n.y;
    }

    // Add padding for canopy foliage and roots
    minX -= 180;
    maxX += 180;
    minY -= 140;
    maxY += 220;

    const rootNode = nodes.find(n => n.isRoot) || nodes[0];

    return {
        nodes,
        branches,
        bounds: {
            minX,
            maxX,
            minY,
            maxY,
            width: Math.max(maxX - minX, 1000),
            height: Math.max(maxY - minY, 800),
        },
        trunk: {
            baseX: rootNode.x,
            baseY: maxY - 60,
            topX: rootNode.x,
            topY: rootNode.y,
            rootNodeId: rootNode.id,
        },
    };
}
