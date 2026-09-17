import React, { useState } from 'react';
import type { BotanicalNode } from '../../utils/treeBotanicalLayout';
import type { Person } from '../../../../types/person';
import type { Language } from '../../../../i18n';
import { getTranslatedContent } from '../../../../i18n';

interface VatvrikshaLeafNodeProps {
    node: BotanicalNode;
    language: Language;
    theme?: string;
    isSelected?: boolean;
    isHighlighted?: boolean;
    canEdit?: boolean;
    onViewDetails: (person: Person) => void;
    onEditPerson?: (person: Person) => void;
    onAddChild?: (parentId: string, type: 'son' | 'daughter') => void;
    onKinshipSelect?: (person: Person) => void;
    onHoverEnter?: (personId: string) => void;
    onHoverLeave?: () => void;
}

export const VatvrikshaLeafNode: React.FC<VatvrikshaLeafNodeProps> = ({
    node,
    language,
    theme,
    isSelected = false,
    isHighlighted = false,
    canEdit = false,
    onViewDetails,
    onEditPerson,
    onAddChild,
    onKinshipSelect,
    onHoverEnter,
    onHoverLeave,
}) => {
    const [showQuickMenu, setShowQuickMenu] = useState(false);
    const { person } = node;
    const isRajashahi = theme === 'rajashahi';

    const displayName = person.translations?.[language]?.name || getTranslatedContent(person.name, language) || person.name;
    const displayRelation = person.translations?.[language]?.relation || getTranslatedContent(person.relation, language) || person.relation;
    const displaySpouse = person.spouse ? (person.translations?.[language]?.spouse || getTranslatedContent(person.spouse, language) || person.spouse) : null;

    // Clean numeric prefixes (e.g., "07. ", "08. ", "1-") so initials reflect actual member names
    const cleanDisplayName = displayName.replace(/^[\d\s.\-()]+/, '').trim() || displayName;
    const cleanSpouseName = (displaySpouse || '').replace(/^[\d\s.\-()]+/, '').trim() || displaySpouse;

    const initials = (cleanDisplayName || '?').trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();
    const spouseInitials = (cleanSpouseName || '?').trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();

    // Alternating vertical stagger offset to prevent adjacent sibling label collisions
    const staggerY = (Math.abs(Math.round(node.x)) % 2 === 0) ? 0 : 8;
    const singleLabelY = 44 + staggerY;
    const coupleLabelY = 42 + staggerY;

    // ────────────────────────────────────────────
    // Case 1: Root Ancestor Grand Trunk Seal
    // ────────────────────────────────────────────
    if (node.isRoot) {
        return (
            <g
                transform={`translate(${node.x}, ${node.y})`}
                className="cursor-pointer select-none group"
                onClick={() => onViewDetails(person)}
                onMouseEnter={() => {
                    setShowQuickMenu(true);
                    onHoverEnter?.(person.id);
                }}
                onMouseLeave={() => {
                    setShowQuickMenu(false);
                    onHoverLeave?.();
                }}
            >
                {/* Flowing Golden Pulse Ring when selected or highlighted */}
                {(isSelected || isHighlighted) && (
                    <circle r={66} fill="none" stroke="#f59e0b" strokeWidth={5} className="animate-pulse" filter="url(#golden-branch-glow)" />
                )}

                {/* Outer Wooden Ornate Medallion */}
                <circle
                    r={56}
                    fill={isRajashahi ? 'url(#royal-gold-seal)' : 'url(#trunk-seal-gradient)'}
                    stroke={isRajashahi ? '#800000' : '#854d0e'}
                    strokeWidth={4}
                    className="shadow-2xl transition-transform duration-300 group-hover:scale-105"
                />

                {/* Inner Ring with Auspicious Stitch Border */}
                <circle
                    r={48}
                    fill={isRajashahi ? '#fff9f0' : '#ffffff'}
                    stroke={isRajashahi ? '#d97706' : '#a16207'}
                    strokeWidth={2}
                    strokeDasharray="4 2"
                />

                {/* Avatar / Photo Cameo */}
                {person.photoUrl ? (
                    <clipPath id={`clip-root-${node.id}`}>
                        <circle r={36} cx={0} cy={-6} />
                    </clipPath>
                ) : null}

                {person.photoUrl ? (
                    <image
                        href={person.photoUrl}
                        x={-36}
                        y={-42}
                        width={72}
                        height={72}
                        clipPath={`url(#clip-root-${node.id})`}
                        preserveAspectRatio="xMidYMid slice"
                    />
                ) : (
                    <circle r={36} cx={0} cy={-6} fill={isRajashahi ? '#800000' : '#1e3a8a'} />
                )}

                {!person.photoUrl && (
                    <text
                        x={0}
                        y={0}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#ffd700"
                        fontSize={20}
                        fontWeight="900"
                    >
                        {initials}
                    </text>
                )}

                {/* Banner Ribbon under Root */}
                <g transform="translate(0, 36)">
                    <rect
                        x={-78}
                        y={0}
                        width={156}
                        height={24}
                        rx={12}
                        fill={isRajashahi ? '#800000' : '#0f172a'}
                        stroke="#ffd700"
                        strokeWidth={1.5}
                    />
                    <text
                        x={0}
                        y={14}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#ffffff"
                        fontSize={11}
                        fontWeight="800"
                    >
                        {displayName}
                    </text>
                </g>

                {/* Sub-label: Mukhya Purush / First Ancestor */}
                <text
                    x={0}
                    y={70}
                    textAnchor="middle"
                    fill={isRajashahi ? '#800000' : '#334155'}
                    fontSize={10}
                    fontWeight="700"
                >
                    👑 {displayRelation || 'Mukhya Purush'}
                </text>
            </g>
        );
    }

    // ────────────────────────────────────────────
    // Case 2: Regular Leaves & Twin Couples
    // ────────────────────────────────────────────
    return (
        <g
            transform={`translate(${node.x}, ${node.y})`}
            className="cursor-pointer select-none group"
            onMouseEnter={() => {
                setShowQuickMenu(true);
                onHoverEnter?.(person.id);
            }}
            onMouseLeave={() => {
                setShowQuickMenu(false);
                onHoverLeave?.();
            }}
        >
            {/* Selection / Highlight Pulse Glow */}
            {(isSelected || isHighlighted) && (
                <circle
                    r={node.hasSpouse ? 54 : 38}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth={4}
                    className="animate-pulse"
                    filter="url(#golden-branch-glow)"
                />
            )}

            {/* If Single Member: Render Single Botanical Leaf with Cameo */}
            {!node.hasSpouse ? (
                <g
                    className="transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-2"
                    onClick={() => onViewDetails(person)}
                >
                    {/* Natural Sacred Peepal / Banyan Leaf Silhouette */}
                    <path
                        d="M 0 -38 C 28 -28, 38 10, 0 38 C -38 10, -28 -28, 0 -38 Z"
                        fill={
                            node.isDeceased
                                ? (isRajashahi ? 'url(#deceased-leaf-royal)' : 'url(#deceased-leaf-gradient)')
                                : (isRajashahi ? 'url(#banyan-leaf-royal)' : 'url(#banyan-leaf-gradient)')
                        }
                        stroke={isRajashahi ? '#ffd700' : '#15803d'}
                        strokeWidth={1.5}
                        className="shadow-md"
                    />

                    {/* Delicate Natural Leaf Veins */}
                    <path
                        d="M 0 -34 L 0 32 M 0 -18 Q 14 -12 24 -4 M 0 -18 Q -14 -12 -24 -4 M 0 -2 Q 15 4 24 14 M 0 -2 Q -15 4 -24 14"
                        fill="none"
                        stroke={isRajashahi ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.35)'}
                        strokeWidth={1.2}
                        strokeLinecap="round"
                    />

                    {/* Member Photo Cameo or Monogram Circle inside Leaf */}
                    {person.photoUrl ? (
                        <>
                            <clipPath id={`clip-leaf-${node.id}`}>
                                <circle r={18} cx={0} cy={-2} />
                            </clipPath>
                            <circle r={20} cx={0} cy={-2} fill="none" stroke="#ffd700" strokeWidth={2} />
                            <image
                                href={person.photoUrl}
                                x={-18}
                                y={-20}
                                width={36}
                                height={36}
                                clipPath={`url(#clip-leaf-${node.id})`}
                                preserveAspectRatio="xMidYMid slice"
                            />
                        </>
                    ) : (
                        <>
                            <circle
                                r={18}
                                cx={0}
                                cy={-2}
                                fill={
                                    node.isDeceased
                                        ? '#78350f'
                                        : person.gender === 'FEMALE'
                                        ? '#e11d48'
                                        : '#1d4ed8'
                                }
                                stroke="#ffffff"
                                strokeWidth={1.5}
                            />
                            <text
                                x={0}
                                y={0}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill="#ffffff"
                                fontSize={10}
                                fontWeight="900"
                            >
                                {initials}
                            </text>
                        </>
                    )}

                    {/* Member Name Label beneath leaf with smart non-colliding stagger */}
                    <g transform={`translate(0, ${singleLabelY})`}>
                        <rect
                            x={-55}
                            y={0}
                            width={110}
                            height={18}
                            rx={9}
                            fill={isRajashahi ? 'rgba(255,253,248,0.96)' : 'rgba(255,255,255,0.96)'}
                            stroke={isRajashahi ? '#ffd700' : '#cbd5e1'}
                            strokeWidth={1}
                            className="shadow-sm"
                        />
                        <text
                            x={0}
                            y={10}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#1e293b"
                            fontSize={9.5}
                            fontWeight="800"
                        >
                            {displayName.length > 14 ? `${displayName.slice(0, 13)}…` : displayName}
                        </text>
                    </g>
                </g>
            ) : (
                // If Married Couple: Render Twin Intertwined Leaves
                <g
                    className="transition-transform duration-300 group-hover:scale-105"
                    onClick={() => onViewDetails(person)}
                >
                    {/* Golden Stem Connector between Couple */}
                    <path
                        d="M -26 0 Q 0 10 26 0"
                        fill="none"
                        stroke="#d97706"
                        strokeWidth={3}
                    />

                    {/* Left Leaf (Member) */}
                    <g transform="translate(-24, 0) rotate(-12)">
                        <path
                            d="M 0 -34 C 24 -24, 32 10, 0 34 C -32 10, -24 -24, 0 -34 Z"
                            fill={isRajashahi ? 'url(#banyan-leaf-royal)' : 'url(#banyan-leaf-gradient)'}
                            stroke={isRajashahi ? '#ffd700' : '#15803d'}
                            strokeWidth={1.5}
                        />
                        {/* Leaf veins */}
                        <line x1={0} y1={-28} x2={0} y2={28} stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
                        {person.photoUrl ? (
                            <>
                                <clipPath id={`clip-left-${node.id}`}>
                                    <circle r={15} cx={0} cy={-2} />
                                </clipPath>
                                <circle r={16.5} cx={0} cy={-2} fill="none" stroke="#ffd700" strokeWidth={1.5} />
                                <image
                                    href={person.photoUrl}
                                    x={-15}
                                    y={-17}
                                    width={30}
                                    height={30}
                                    clipPath={`url(#clip-left-${node.id})`}
                                    preserveAspectRatio="xMidYMid slice"
                                />
                            </>
                        ) : (
                            <>
                                <circle r={15} cx={0} cy={-2} fill={person.gender === 'FEMALE' ? '#e11d48' : '#1d4ed8'} stroke="#ffffff" strokeWidth={1} />
                                <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fill="#ffffff" fontSize={9} fontWeight="900">
                                    {initials}
                                </text>
                            </>
                        )}
                    </g>

                    {/* Right Leaf (Spouse) */}
                    <g transform="translate(24, 0) rotate(12)">
                        <path
                            d="M 0 -34 C 24 -24, 32 10, 0 34 C -32 10, -24 -24, 0 -34 Z"
                            fill={isRajashahi ? 'url(#spouse-leaf-royal)' : 'url(#spouse-leaf-gradient)'}
                            stroke={isRajashahi ? '#ffd700' : '#e11d48'}
                            strokeWidth={1.5}
                        />
                        <line x1={0} y1={-28} x2={0} y2={28} stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
                        {node.spousePhotoUrl ? (
                            <>
                                <clipPath id={`clip-right-${node.id}`}>
                                    <circle r={15} cx={0} cy={-2} />
                                </clipPath>
                                <circle r={16.5} cx={0} cy={-2} fill="none" stroke="#ffd700" strokeWidth={1.5} />
                                <image
                                    href={node.spousePhotoUrl}
                                    x={-15}
                                    y={-17}
                                    width={30}
                                    height={30}
                                    clipPath={`url(#clip-right-${node.id})`}
                                    preserveAspectRatio="xMidYMid slice"
                                />
                            </>
                        ) : (
                            <>
                                <circle r={15} cx={0} cy={-2} fill={person.gender === 'FEMALE' ? '#1d4ed8' : '#e11d48'} stroke="#ffffff" strokeWidth={1} />
                                <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fill="#ffffff" fontSize={9} fontWeight="900">
                                    {spouseInitials}
                                </text>
                            </>
                        )}
                    </g>

                    {/* Center Union Heart / Sacred Love Knot */}
                    <circle r={10} cx={0} cy={4} fill="#e11d48" stroke="#ffd700" strokeWidth={1.5} />
                    <text x={0} y={5} textAnchor="middle" dominantBaseline="central" fill="#ffffff" fontSize={9}>
                        ❤️
                    </text>

                    {/* Combined Names Label Bar with smart stagger */}
                    <g transform={`translate(0, ${coupleLabelY})`}>
                        <rect
                            x={-72}
                            y={0}
                            width={144}
                            height={20}
                            rx={10}
                            fill={isRajashahi ? '#fffdf8' : '#ffffff'}
                            stroke={isRajashahi ? '#ffd700' : '#cbd5e1'}
                            strokeWidth={1}
                            className="shadow-sm"
                        />
                        <text
                            x={0}
                            y={11}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#1e293b"
                            fontSize={9}
                            fontWeight="800"
                        >
                            {displayName.split(' ')[0]} & {displaySpouse?.split(' ')[0]}
                        </text>
                    </g>
                </g>
            )}

            {/* Memorial 🕊️ Badge if Deceased */}
            {node.isDeceased && (
                <g transform="translate(18, -26)">
                    <circle r={8} fill="#1e293b" stroke="#ffd700" strokeWidth={1} />
                    <text x={0} y={1} textAnchor="middle" dominantBaseline="central" fontSize={7.5} fill="#ffffff">
                        🕊️
                    </text>
                </g>
            )}

            {/* Interactive Quick-Action Floating Menu for Editor/Admin on Hover */}
            {canEdit && showQuickMenu && (
                <g transform="translate(0, -58)" className="animate-fadeIn">
                    <rect
                        x={-55}
                        y={-14}
                        width={110}
                        height={26}
                        rx={13}
                        fill="#0f172a"
                        stroke="#e2e8f0"
                        strokeWidth={1}
                        opacity={0.96}
                    />

                    {/* Add Son Button */}
                    <g
                        transform="translate(-36, -1)"
                        className="cursor-pointer hover:opacity-80"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddChild?.(person.id, 'son');
                        }}
                    >
                        <circle r={8} fill="#3b82f6" />
                        <text x={0} y={1} textAnchor="middle" dominantBaseline="central" fill="#ffffff" fontSize={8} fontWeight="bold">+👦</text>
                    </g>

                    {/* Add Daughter Button */}
                    <g
                        transform="translate(-12, -1)"
                        className="cursor-pointer hover:opacity-80"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddChild?.(person.id, 'daughter');
                        }}
                    >
                        <circle r={8} fill="#ec4899" />
                        <text x={0} y={1} textAnchor="middle" dominantBaseline="central" fill="#ffffff" fontSize={8} fontWeight="bold">+👧</text>
                    </g>

                    {/* Edit Details Button */}
                    <g
                        transform="translate(12, -1)"
                        className="cursor-pointer hover:opacity-80"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEditPerson?.(person);
                        }}
                    >
                        <circle r={8} fill="#f59e0b" />
                        <text x={0} y={1} textAnchor="middle" dominantBaseline="central" fill="#ffffff" fontSize={8} fontWeight="bold">✏️</text>
                    </g>

                    {/* Kinship Select Button */}
                    <g
                        transform="translate(36, -1)"
                        className="cursor-pointer hover:opacity-80"
                        onClick={(e) => {
                            e.stopPropagation();
                            onKinshipSelect?.(person);
                        }}
                    >
                        <circle r={8} fill="#8b5cf6" />
                        <text x={0} y={1} textAnchor="middle" dominantBaseline="central" fill="#ffffff" fontSize={8} fontWeight="bold">🌱</text>
                    </g>
                </g>
            )}
        </g>
    );
};
