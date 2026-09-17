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

    // ────────────────────────────────────────────
    // Case 1: Root Ancestor Grand Trunk Seal
    // ────────────────────────────────────────────
    if (node.isRoot) {
        return (
            <g
                transform={`translate(${node.x}, ${node.y})`}
                className="cursor-pointer select-none group"
                onClick={() => onViewDetails(person)}
            >
                {/* Glow ring when selected */}
                {(isSelected || isHighlighted) && (
                    <circle r={64} fill="none" stroke="#f59e0b" strokeWidth={4} className="animate-pulse" filter="url(#golden-branch-glow)" />
                )}

                {/* Outer Wooden Ornate Medallion */}
                <circle
                    r={56}
                    fill={isRajashahi ? 'url(#royal-gold-seal)' : 'url(#trunk-seal-gradient)'}
                    stroke={isRajashahi ? '#800000' : '#854d0e'}
                    strokeWidth={4}
                    className="shadow-2xl transition-transform duration-300 group-hover:scale-105"
                />

                {/* Inner Ring */}
                <circle
                    r={48}
                    fill={isRajashahi ? '#fff9f0' : '#ffffff'}
                    stroke={isRajashahi ? '#d97706' : '#a16207'}
                    strokeWidth={2}
                    strokeDasharray="4 2"
                />

                {/* Avatar / Photo */}
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
                        x={-75}
                        y={0}
                        width={150}
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
            onMouseEnter={() => setShowQuickMenu(true)}
            onMouseLeave={() => setShowQuickMenu(false)}
        >
            {/* Selection / Highlight Pulse Glow */}
            {(isSelected || isHighlighted) && (
                <circle
                    r={node.hasSpouse ? 52 : 36}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth={4}
                    className="animate-pulse"
                    filter="url(#golden-branch-glow)"
                />
            )}

            {/* If Single Member: Render Single Botanical Leaf */}
            {!node.hasSpouse ? (
                <g
                    className="transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-2"
                    onClick={() => onViewDetails(person)}
                >
                    {/* Natural Leaf Shape */}
                    <path
                        d="M 0 -36 C 28 -28, 36 12, 0 36 C -36 12, -28 -28, 0 -36 Z"
                        fill={
                            node.isDeceased
                                ? (isRajashahi ? 'url(#deceased-leaf-royal)' : 'url(#deceased-leaf-gradient)')
                                : (isRajashahi ? 'url(#banyan-leaf-royal)' : 'url(#banyan-leaf-gradient)')
                        }
                        stroke={isRajashahi ? '#ffd700' : '#15803d'}
                        strokeWidth={1.5}
                        className="shadow-md"
                    />

                    {/* Leaf Central Vein */}
                    <line x1={0} y1={-32} x2={0} y2={30} stroke={isRajashahi ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.4)'} strokeWidth={1.5} />

                    {/* Member Monogram Circle inside Leaf */}
                    <circle
                        r={18}
                        cx={0}
                        cy={-2}
                        fill={person.gender === 'FEMALE' ? '#e11d48' : '#2563eb'}
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

                    {/* Member Name Label beneath leaf */}
                    <g transform="translate(0, 44)">
                        <rect
                            x={-55}
                            y={0}
                            width={110}
                            height={18}
                            rx={9}
                            fill={isRajashahi ? 'rgba(255,253,248,0.95)' : 'rgba(255,255,255,0.95)'}
                            stroke={isRajashahi ? '#ffd700' : '#cbd5e1'}
                            strokeWidth={1}
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
                            d="M 0 -32 C 24 -24, 30 10, 0 32 C -30 10, -24 -24, 0 -32 Z"
                            fill={isRajashahi ? 'url(#banyan-leaf-royal)' : 'url(#banyan-leaf-gradient)'}
                            stroke={isRajashahi ? '#ffd700' : '#15803d'}
                            strokeWidth={1.5}
                        />
                        <circle r={15} cx={0} cy={-2} fill={person.gender === 'FEMALE' ? '#e11d48' : '#2563eb'} stroke="#ffffff" strokeWidth={1} />
                        <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fill="#ffffff" fontSize={9} fontWeight="900">
                            {initials}
                        </text>
                    </g>

                    {/* Right Leaf (Spouse) */}
                    <g transform="translate(24, 0) rotate(12)">
                        <path
                            d="M 0 -32 C 24 -24, 30 10, 0 32 C -30 10, -24 -24, 0 -32 Z"
                            fill={isRajashahi ? 'url(#spouse-leaf-royal)' : 'url(#spouse-leaf-gradient)'}
                            stroke={isRajashahi ? '#ffd700' : '#e11d48'}
                            strokeWidth={1.5}
                        />
                        <circle r={15} cx={0} cy={-2} fill={person.gender === 'FEMALE' ? '#2563eb' : '#e11d48'} stroke="#ffffff" strokeWidth={1} />
                        <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fill="#ffffff" fontSize={9} fontWeight="900">
                            {spouseInitials}
                        </text>
                    </g>

                    {/* Center Union Heart / Knot */}
                    <circle r={9} cx={0} cy={4} fill="#e11d48" stroke="#ffffff" strokeWidth={1} />
                    <text x={0} y={5} textAnchor="middle" dominantBaseline="central" fill="#ffffff" fontSize={8}>
                        ❤️
                    </text>

                    {/* Combined Names Label Bar */}
                    <g transform="translate(0, 42)">
                        <rect
                            x={-70}
                            y={0}
                            width={140}
                            height={20}
                            rx={10}
                            fill={isRajashahi ? '#fffdf8' : '#ffffff'}
                            stroke={isRajashahi ? '#ffd700' : '#cbd5e1'}
                            strokeWidth={1}
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
                    <circle r={7} fill="#1e293b" stroke="#ffffff" strokeWidth={1} />
                    <text x={0} y={1} textAnchor="middle" dominantBaseline="central" fontSize={7} fill="#ffffff">
                        🕊️
                    </text>
                </g>
            )}

            {/* Interactive Quick-Action Floating Menu for Editor/Admin on Hover */}
            {canEdit && showQuickMenu && (
                <g transform="translate(0, -56)" className="animate-fadeIn">
                    <rect
                        x={-55}
                        y={-14}
                        width={110}
                        height={26}
                        rx={13}
                        fill="#0f172a"
                        stroke="#e2e8f0"
                        strokeWidth={1}
                        opacity={0.95}
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
