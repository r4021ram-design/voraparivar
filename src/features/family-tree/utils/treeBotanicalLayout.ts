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

export interface CanopyCloud {
    id: string;
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    colorVariant: 'deep' | 'emerald' | 'lime' | 'gold';
    opacity: number;
}

export interface AerialRoot {
    id: string;
    pathData: string;
    thickness: number;
}

export interface BotanicalTreeLayout {
    nodes: BotanicalNode[];
    branches: BotanicalBranch[];
    canopyClouds: CanopyCloud[];
    aerialRoots: AerialRoot[];
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
        width: number;
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

const LEAF_HORIZONTAL_SPACING = 68; // Clean, natural spacing for banyan leaves without empty voids

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
function assignXCoordinates(
    node: LayoutNodeInternal,
    leftBoundary: number
): number {
    const totalWidth = node.leafCount * LEAF_HORIZONTAL_SPACING;

    if (node.children.length === 0) {
        node.x = leftBoundary + totalWidth / 2;
        return leftBoundary + totalWidth;
    }

    let currentLeft = leftBoundary;
    const childMidpoints: number[] = [];

    for (const child of node.children) {
        currentLeft = assignXCoordinates(child, currentLeft);
        childMidpoints.push(child.x);
    }

    // Center parent over its children
    node.x = (childMidpoints[0] + childMidpoints[childMidpoints.length - 1]) / 2;

    return leftBoundary + totalWidth;
}

/**
 * Assigns Y coordinates proportionally:
 * - Linear founding ancestors with 1 child sit compactly on the sacred trunk column (75px)
 * - Branching generations fan out with graceful 120px bough spacing
 */
function assignYCoordinates(
    node: LayoutNodeInternal,
    currentY: number
) {
    node.y = currentY;

    for (const child of node.children) {
        const isLinearTrunk = node.children.length <= 1;
        const verticalGap = isLinearTrunk ? 75 : 120;
        assignYCoordinates(child, currentY - verticalGap);
    }
}

/**
 * Creates natural organic wooden curve connecting parent branch to child branch.
 * Enforces vertical-first emergence, sweeping bough trajectory, and gentle organic wobble.
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
    const wobbleScale = Math.max(3, 9 - generation * 1.2);
    const wobble = Math.sin(startX * 0.03 + endX * 0.03) * wobbleScale;

    // Control point 1: rises vertically from parent trunk/bough before sweeping outward
    const cp1X = startX + deltaX * 0.08 + wobble;
    const cp1Y = startY + deltaY * 0.65;

    // Control point 2: gracefully eases vertically into child leaf stem
    const cp2X = endX - deltaX * 0.12 - wobble * 0.5;
    const cp2Y = startY + deltaY * 0.90;

    return `M ${startX.toFixed(1)} ${startY.toFixed(1)} C ${cp1X.toFixed(1)} ${cp1Y.toFixed(1)}, ${cp2X.toFixed(1)} ${cp2Y.toFixed(1)}, ${endX.toFixed(1)} ${endY.toFixed(1)}`;
}

/**
 * Computes branch thickness tapering from trunk to outer foliage.
 */
function getBranchThickness(generation: number): number {
    switch (generation) {
        case 1: return 36; // Grand primary bough
        case 2: return 26; // Secondary boughs
        case 3: return 18; // Tertiary branches
        case 4: return 11; // Intermediate twigs
        default: return 6; // Delicate outer twigs
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

    // 2. Position all nodes horizontally (compact 68px leaf span)
    assignXCoordinates(internalRoot, 80);

    // 3. Position all nodes vertically from base trunk upwards
    const BASE_TREE_Y = 820; // Anchor root at base Y
    assignYCoordinates(internalRoot, BASE_TREE_Y);

    // 4. Find horizontal span to compute natural dome arching (छतरीनुमा फैलाव)
    let minLeafX = Infinity;
    let maxLeafX = -Infinity;
    function findLeafSpan(n: LayoutNodeInternal) {
        if (n.x < minLeafX) minLeafX = n.x;
        if (n.x > maxLeafX) maxLeafX = n.x;
        n.children.forEach(findLeafSpan);
    }
    findLeafSpan(internalRoot);

    const treeSpanWidth = Math.max(maxLeafX - minLeafX, 600);
    const treeCenterX = (minLeafX + maxLeafX) / 2;

    // Apply natural radial dome canopy arch: center branches rise higher, outer branches drape gracefully
    function applyCanopyDome(n: LayoutNodeInternal) {
        if (n.children.length === 0 || n.generation > 2) {
            const distFromCenter = Math.abs(n.x - treeCenterX);
            const normalizedDist = Math.min(1, distFromCenter / (treeSpanWidth * 0.52));
            // Cosine dome curve: up to 90px lift at center crown, tapering outward
            const domeLift = Math.cos(normalizedDist * (Math.PI / 2)) * 90;
            // Subtle organic stagger so siblings don't sit on a robotic ruler
            const stagger = Math.sin(n.x * 0.08) * 14;
            n.y = n.y - domeLift + stagger;
        }
        n.children.forEach(applyCanopyDome);
    }
    applyCanopyDome(internalRoot);

    const nodes: BotanicalNode[] = [];
    const branches: BotanicalBranch[] = [];
    const canopyClouds: CanopyCloud[] = [];
    const aerialRoots: AerialRoot[] = [];

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

        // Generate lush background foliage canopy clouds around nodes
        const cloudVariants: ('deep' | 'emerald' | 'lime' | 'gold')[] = ['deep', 'emerald', 'lime', 'emerald'];
        const variant = cloudVariants[node.generation % cloudVariants.length];
        const baseRadius = node.generation > 2 ? 80 : 110;

        canopyClouds.push({
            id: `canopy-${node.person.id}`,
            cx: node.x + (Math.sin(node.x * 0.1) * 15),
            cy: node.y - 10 + (Math.cos(node.y * 0.1) * 10),
            rx: baseRadius + (Math.sin(node.x * 0.05) * 20),
            ry: (baseRadius * 0.75) + (Math.cos(node.y * 0.05) * 15),
            colorVariant: variant,
            opacity: node.generation === 1 ? 0.35 : 0.25,
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

            // For major branches (Gen 1 to Gen 3 with notable horizontal spread), generate hanging aerial roots
            if (parent.generation <= 3 && Math.abs(node.x - parent.x) > 100) {
                const midX = (parent.x + node.x) / 2 + (Math.sin(node.x) * 12);
                const midY = (parent.y + node.y) / 2;
                const rootDropLength = Math.min(100, Math.max(40, BASE_TREE_Y - midY));

                // Hanging fibrous banyan aerial root with gentle organic waviness
                const rootPath = `M ${midX.toFixed(1)} ${midY.toFixed(1)} Q ${(midX + 5).toFixed(1)} ${(midY + rootDropLength * 0.5).toFixed(1)} ${(midX - 2).toFixed(1)} ${(midY + rootDropLength).toFixed(1)}`;

                aerialRoots.push({
                    id: `aerial-root-${parent.person.id}-${node.person.id}`,
                    pathData: rootPath,
                    thickness: Math.max(1.5, 3.2 - parent.generation * 0.7),
                });
            }
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

    const rootNode = nodes.find(n => n.isRoot) || nodes[0];
    const trunkBaseY = rootNode.y + 120; // Trunk firmly beneath the founding ancestor

    // Add padding for foliage canopy clouds and earth mound
    minX -= 90;
    maxX += 90;
    minY -= 80;
    maxY = trunkBaseY + 70; // Mound base inside bounds

    return {
        nodes,
        branches,
        canopyClouds,
        aerialRoots,
        bounds: {
            minX,
            maxX,
            minY,
            maxY,
            width: Math.max(maxX - minX, 800),
            height: Math.max(maxY - minY, 600),
        },
        trunk: {
            baseX: rootNode.x,
            baseY: trunkBaseY,
            topX: rootNode.x,
            topY: rootNode.y,
            width: 100,
            rootNodeId: rootNode.id,
        },
    };
}
