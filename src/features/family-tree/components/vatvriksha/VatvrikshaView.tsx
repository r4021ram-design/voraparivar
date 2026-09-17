import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import type { Person } from '../../../../types/person';
import type { Language } from '../../../../i18n';
import type { Theme } from '../../../../types/ui';
import { calculateBotanicalLayout } from '../../utils/treeBotanicalLayout';
import { VatvrikshaBranch } from './VatvrikshaBranch';
import { VatvrikshaLeafNode } from './VatvrikshaLeafNode';
import { toPng } from 'html-to-image';
import { 
    ZoomIn, ZoomOut, Maximize2, Download 
} from 'lucide-react';
import clsx from 'clsx';

interface VatvrikshaViewProps {
    treeData: Person;
    language: Language;
    theme: Theme;
    highlightedPath?: string[];
    selectedNodeId?: string | null;
    userRole: string;
    headerTitle?: string;
    headerVerse?: string;
    onViewDetails: (person: Person) => void;
    onEditPerson: (person: Person) => void;
    onAddChild: (parentId: string, type: 'son' | 'daughter') => void;
    onKinshipSelect: (person: Person) => void;
}

export const VatvrikshaView: React.FC<VatvrikshaViewProps> = ({
    treeData,
    language,
    theme,
    highlightedPath = [],
    selectedNodeId = null,
    userRole,
    headerTitle,
    headerVerse,
    onViewDetails,
    onEditPerson,
    onAddChild,
    onKinshipSelect,
}) => {
    const isRajashahi = theme === 'rajashahi';
    const canEdit = userRole === 'ADMIN' || userRole === 'STANDARD';

    // 1. Interactive Hover Lineage Tracker: Precompute child -> parent lookup map
    const parentMap = useMemo(() => {
        const map = new Map<string, string>();
        function mapParents(person: Person) {
            if (person.children) {
                for (const child of person.children) {
                    map.set(child.id, person.id);
                    mapParents(child);
                }
            }
        }
        mapParents(treeData);
        return map;
    }, [treeData]);

    const [hoveredAncestors, setHoveredAncestors] = useState<string[]>([]);

    const handleHoverEnter = useCallback((personId: string) => {
        const path: string[] = [personId];
        let curr = personId;
        while (parentMap.has(curr)) {
            const parentId = parentMap.get(curr)!;
            path.push(parentId);
            curr = parentId;
        }
        setHoveredAncestors(path);
    }, [parentMap]);

    const handleHoverLeave = useCallback(() => {
        setHoveredAncestors([]);
    }, []);

    const activeGlowingSet = useMemo(() => {
        return new Set([...highlightedPath, ...hoveredAncestors]);
    }, [highlightedPath, hoveredAncestors]);

    // 2. Calculate botanical tree geometry
    const layout = useMemo(() => {
        return calculateBotanicalLayout(treeData, highlightedPath);
    }, [treeData, highlightedPath]);

    // 3. Pan and Zoom Transform State
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.85);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isExporting, setIsExporting] = useState(false);

    // Initial center on tree trunk & canopy with flawless vertical framing
    const centerTree = useCallback(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        
        // Generous breathing margins so neither the sides nor the top/bottom ever cut off
        const topNavPadding = 125;
        const bottomNavPadding = 80;
        const horizontalPadding = 100;

        const availableWidth = rect.width - horizontalPadding;
        const availableHeight = rect.height - topNavPadding - bottomNavPadding;

        const scaleX = availableWidth / layout.bounds.width;
        const scaleY = availableHeight / layout.bounds.height;
        const initScale = Math.min(scaleX, scaleY, 0.90);

        const treeCenterX = (layout.bounds.minX + layout.bounds.maxX) / 2;
        
        // Exact vertical positioning ensuring top canopy and bottom roots are both 100% visible
        const scaledTreeHeight = layout.bounds.height * initScale;
        const verticalExcess = Math.max(0, availableHeight - scaledTreeHeight);
        const panY = topNavPadding + (verticalExcess / 2) - layout.bounds.minY * initScale;

        setScale(initScale);
        setPan({
            x: rect.width / 2 - treeCenterX * initScale,
            y: panY,
        });
    }, [layout]);

    useEffect(() => {
        centerTree();
        window.addEventListener('resize', centerTree);
        return () => window.removeEventListener('resize', centerTree);
    }, [centerTree]);

    // 4. Mouse Pan Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return; // Only left click
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPan({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // 5. Wheel Zoom
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
        const newScale = Math.min(Math.max(scale * zoomFactor, 0.12), 2.5);

        // Zoom towards mouse cursor
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            setPan(prev => ({
                x: mouseX - (mouseX - prev.x) * (newScale / scale),
                y: mouseY - (mouseY - prev.y) * (newScale / scale),
            }));
            setScale(newScale);
        }
    };

    // 6. High-Definition Wall Poster Export
    const handleDownloadPoster = async () => {
        if (!containerRef.current) return;
        setIsExporting(true);

        try {
            const svgElement = containerRef.current.querySelector('.vatvriksha-svg-canvas') as HTMLElement;
            if (!svgElement) throw new Error('SVG Canvas element not found');

            const dataUrl = await toPng(svgElement, {
                backgroundColor: isRajashahi ? '#fffcf5' : theme === 'dark' ? '#070b12' : '#f0fdf4',
                quality: 1,
                pixelRatio: 2.5, // Ultra crisp for poster printing
            });

            const link = document.createElement('a');
            link.download = `${headerTitle || 'Vatvriksha_Family_Tree'}_poster.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to export Vatvriksha poster:', err);
            alert('Poster export failed. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div
            ref={containerRef}
            className={clsx(
                "relative w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing font-inter transition-colors duration-500",
                isRajashahi
                    ? "bg-gradient-to-b from-[#fffcf7] via-[#fff5e5] to-[#f4e8d0]"
                    : theme === 'dark'
                    ? "bg-gradient-to-b from-[#060a10] via-[#0b1320] to-[#04080e]"
                    : "bg-gradient-to-b from-[#f0f9ff] via-[#fefce8]/40 to-[#ecfdf5]"
            )}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
        >
            {/* Soft Celestial Dawn Aura in Center of Tree */}
            <div 
                className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20"
                style={{
                    background: isRajashahi 
                        ? 'radial-gradient(circle at 50% 45%, rgba(251, 191, 36, 0.25) 0%, rgba(245, 158, 11, 0.08) 45%, transparent 70%)'
                        : 'radial-gradient(circle at 50% 45%, rgba(52, 211, 153, 0.2) 0%, rgba(250, 204, 21, 0.08) 45%, transparent 70%)',
                }}
            />

            {/* Cultural Banner Heading in Vatvriksha Mode */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none z-10 text-center px-4 max-w-xl animate-in fade-in duration-500">
                {headerVerse && (
                    <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-400 italic mb-0.5 tracking-wide">
                        {headerVerse}
                    </p>
                )}
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white rajashahi:text-[#800000] tracking-tight drop-shadow-sm flex items-center justify-center gap-2">
                    <span>🌳</span>
                    <span>{headerTitle || 'પરિવાર વટવૃક્ષ દર્શન'}</span>
                </h2>
                <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-700/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 backdrop-blur-sm">
                        {layout.nodes.length} પરિવારના પર્ણો (Members) • {layout.branches.length} શાખાઓ
                    </span>
                </div>
            </div>

            {/* Main Infinite SVG Tree Canvas with overflow visible */}
            <svg
                className="vatvriksha-svg-canvas absolute inset-0 w-full h-full pointer-events-auto"
                style={{ overflow: 'visible' }}
            >
                <defs>
                    <style>
                        {`
                            @keyframes flowingVein {
                                0% { stroke-dashoffset: 48; }
                                100% { stroke-dashoffset: 0; }
                            }
                            .animate-flowing-vein {
                                animation: flowingVein 1.2s linear infinite;
                            }
                        `}
                    </style>

                    {/* Natural Wooden Bark Gradient */}
                    <linearGradient id="natural-wood-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#381a07" />
                        <stop offset="35%" stopColor="#5c2d10" />
                        <stop offset="70%" stopColor="#7a421b" />
                        <stop offset="100%" stopColor="#431e08" />
                    </linearGradient>

                    {/* Royal Gold/Wood Gradient for Rajashahi */}
                    <linearGradient id="royal-wood-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#4a1202" />
                        <stop offset="45%" stopColor="#701e07" />
                        <stop offset="85%" stopColor="#9a3412" />
                        <stop offset="100%" stopColor="#4a1202" />
                    </linearGradient>

                    {/* Aerial Hanging Root Gradient */}
                    <linearGradient id="aerial-root-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#78350f" stopOpacity="0.95" />
                        <stop offset="70%" stopColor="#92400e" stopOpacity="0.65" />
                        <stop offset="100%" stopColor="#b45309" stopOpacity="0.15" />
                    </linearGradient>

                    {/* Sacred Stone Platform Gradient (ओटला / चबूतरा) */}
                    <linearGradient id="sacred-chabutra-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#e2e8f0" />
                        <stop offset="50%" stopColor="#cbd5e1" />
                        <stop offset="100%" stopColor="#94a3b8" />
                    </linearGradient>

                    <linearGradient id="royal-chabutra-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#fef3c7" />
                        <stop offset="50%" stopColor="#fde68a" />
                        <stop offset="100%" stopColor="#d97706" />
                    </linearGradient>

                    {/* Foliage Canopy Cloud Gradients */}
                    <radialGradient id="canopy-cloud-deep" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#14532d" stopOpacity="0.8" />
                        <stop offset="60%" stopColor="#166534" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#15803d" stopOpacity="0" />
                    </radialGradient>

                    <radialGradient id="canopy-cloud-emerald" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#15803d" stopOpacity="0.75" />
                        <stop offset="65%" stopColor="#16a34a" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                    </radialGradient>

                    <radialGradient id="canopy-cloud-lime" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#16a34a" stopOpacity="0.7" />
                        <stop offset="60%" stopColor="#4ade80" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#86efac" stopOpacity="0" />
                    </radialGradient>

                    <radialGradient id="canopy-cloud-gold" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ca8a04" stopOpacity="0.65" />
                        <stop offset="65%" stopColor="#eab308" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
                    </radialGradient>

                    {/* Root Grand Seal Gradient */}
                    <linearGradient id="royal-gold-seal" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fef08a" />
                        <stop offset="50%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#b45309" />
                    </linearGradient>

                    <linearGradient id="trunk-seal-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f8fafc" />
                        <stop offset="50%" stopColor="#e2e8f0" />
                        <stop offset="100%" stopColor="#cbd5e1" />
                    </linearGradient>

                    {/* Lush Green Banyan Leaves Gradient */}
                    <linearGradient id="banyan-leaf-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#22c55e" />
                        <stop offset="50%" stopColor="#16a34a" />
                        <stop offset="100%" stopColor="#15803d" />
                    </linearGradient>

                    <linearGradient id="banyan-leaf-royal" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#84cc16" />
                        <stop offset="60%" stopColor="#4d7c0f" />
                        <stop offset="100%" stopColor="#365314" />
                    </linearGradient>

                    {/* Spouse Rose/Pink Leaf Gradient */}
                    <linearGradient id="spouse-leaf-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#fb7185" />
                        <stop offset="60%" stopColor="#e11d48" />
                        <stop offset="100%" stopColor="#9f1239" />
                    </linearGradient>

                    <linearGradient id="spouse-leaf-royal" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#f472b6" />
                        <stop offset="60%" stopColor="#be185d" />
                        <stop offset="100%" stopColor="#881337" />
                    </linearGradient>

                    {/* Deceased Ancestor Sacred Leaf Gradient */}
                    <linearGradient id="deceased-leaf-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#fef08a" />
                        <stop offset="50%" stopColor="#eab308" />
                        <stop offset="100%" stopColor="#a16207" />
                    </linearGradient>

                    <linearGradient id="deceased-leaf-royal" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#fef9c3" />
                        <stop offset="50%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#d97706" />
                    </linearGradient>

                    {/* Kinship Glowing Filter */}
                    <filter id="golden-branch-glow" x="-25%" y="-25%" width="150%" height="150%">
                        <feGaussianBlur stdDeviation="8" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Main Interactive Pan & Zoom Tree Viewport */}
                <g 
                    className="vatvriksha-viewport-transform"
                    transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`}
                >
                    {/* 1. Lush Green Canopy Foliage Clouds (Background Body of the Tree) */}
                    <g className="vatvriksha-canopy-layer" pointerEvents="none">
                        {layout.canopyClouds.map(cloud => {
                            const gradientId = cloud.colorVariant === 'deep'
                                ? 'url(#canopy-cloud-deep)'
                                : cloud.colorVariant === 'lime'
                                ? 'url(#canopy-cloud-lime)'
                                : cloud.colorVariant === 'gold'
                                ? 'url(#canopy-cloud-gold)'
                                : 'url(#canopy-cloud-emerald)';

                            return (
                                <ellipse
                                    key={cloud.id}
                                    cx={cloud.cx}
                                    cy={cloud.cy}
                                    rx={cloud.rx}
                                    ry={cloud.ry}
                                    fill={gradientId}
                                    opacity={cloud.opacity}
                                />
                            );
                        })}
                    </g>

                    {/* 2. Hanging Banyan Aerial Prop Roots (वटवृक्ष की जटाएं) */}
                    <g className="vatvriksha-aerial-roots" pointerEvents="none">
                        {layout.aerialRoots.map(root => (
                            <path
                                key={root.id}
                                d={root.pathData}
                                fill="none"
                                stroke="url(#aerial-root-gradient)"
                                strokeWidth={root.thickness}
                                strokeLinecap="round"
                                opacity={root.opacity}
                            />
                        ))}
                    </g>

                    {/* 3. Sacred Earth Mound & Sacred Stone Chabutra (चबूतरा / ओटला) */}
                    <g className="vatvriksha-earth-roots" opacity={0.95}>
                        {/* Lower Sacred Stone Slab (Tier 1) */}
                        <ellipse
                            cx={layout.trunk.baseX}
                            cy={layout.trunk.baseY + 52}
                            rx={250}
                            ry={50}
                            fill={isRajashahi ? 'url(#royal-chabutra-gradient)' : 'url(#sacred-chabutra-gradient)'}
                            opacity={0.38}
                        />

                        {/* Upper Raised Chabutra Platform (Tier 2) */}
                        <ellipse
                            cx={layout.trunk.baseX}
                            cy={layout.trunk.baseY + 38}
                            rx={195}
                            ry={36}
                            fill={isRajashahi ? '#78350f' : '#15803d'}
                            opacity={0.55}
                        />

                        {/* Sprawling Ancient Buttress Roots Anchored into the Soil & Stones */}
                        {[-190, -135, -80, -35, 35, 80, 135, 190].map((rx, idx) => (
                            <path
                                key={idx}
                                d={`M ${layout.trunk.baseX} ${layout.trunk.baseY} Q ${layout.trunk.baseX + rx * 0.45} ${layout.trunk.baseY + 26} ${layout.trunk.baseX + rx} ${layout.trunk.baseY + 58}`}
                                fill="none"
                                stroke={isRajashahi ? '#4a1202' : '#381a07'}
                                strokeWidth={Math.max(6, 22 - Math.abs(rx) * 0.08)}
                                strokeLinecap="round"
                            />
                        ))}

                        {/* Fresh Green Grass & Floral Tufts around Chabutra */}
                        {[-120, -75, -25, 25, 75, 120].map((gx, idx) => (
                            <path
                                key={`grass-${idx}`}
                                d={`M ${layout.trunk.baseX + gx} ${layout.trunk.baseY + 44} L ${layout.trunk.baseX + gx - 7} ${layout.trunk.baseY + 26} M ${layout.trunk.baseX + gx} ${layout.trunk.baseY + 44} L ${layout.trunk.baseX + gx + 7} ${layout.trunk.baseY + 24}`}
                                stroke="#22c55e"
                                strokeWidth={2.2}
                                strokeLinecap="round"
                            />
                        ))}
                    </g>

                    {/* 4. Ancient Grand Sculptural Banyan Trunk (Rising from Roots to Root Ancestor) */}
                    <g className="vatvriksha-grand-trunk">
                        {/* Flared Buttress Trunk Body */}
                        <path
                            d={`M ${layout.trunk.baseX - 75} ${layout.trunk.baseY + 15} Q ${layout.trunk.baseX - 48} ${(layout.trunk.baseY + layout.trunk.topY) / 2} ${layout.trunk.topX - 34} ${layout.trunk.topY + 30} L ${layout.trunk.topX + 34} ${layout.trunk.topY + 30} Q ${layout.trunk.baseX + 48} ${(layout.trunk.baseY + layout.trunk.topY) / 2} ${layout.trunk.baseX + 75} ${layout.trunk.baseY + 15} Z`}
                            fill={isRajashahi ? 'url(#royal-wood-gradient)' : 'url(#natural-wood-gradient)'}
                            stroke={isRajashahi ? '#3b0d01' : '#1e1107'}
                            strokeWidth={3.5}
                        />

                        {/* Vertical Trunk Bark Grain Textures, Knots & Deep Furrows */}
                        {[-40, -22, -8, 8, 22, 40].map((gx, idx) => (
                            <path
                                key={idx}
                                d={`M ${layout.trunk.baseX + gx * 1.6} ${layout.trunk.baseY + 6} Q ${layout.trunk.baseX + gx} ${(layout.trunk.baseY + layout.trunk.topY) / 2} ${layout.trunk.topX + gx * 0.7} ${layout.trunk.topY + 35}`}
                                fill="none"
                                stroke="rgba(255, 255, 255, 0.2)"
                                strokeWidth={2.5}
                                strokeLinecap="round"
                            />
                        ))}
                    </g>

                    {/* 5. Wooden Branches Connecting All Generations */}
                    <g className="vatvriksha-branches-layer">
                        {layout.branches.map(branch => {
                            const isBranchLit = branch.isHighlighted || (
                                activeGlowingSet.has(branch.sourceId) && activeGlowingSet.has(branch.targetId)
                            );
                            return (
                                <VatvrikshaBranch
                                    key={branch.id}
                                    branch={{ ...branch, isHighlighted: isBranchLit }}
                                    theme={theme}
                                />
                            );
                        })}
                    </g>

                    {/* 6. Major Lineage Branch Badges / Ribbons (शाखा पट्टिका) */}
                    <g className="vatvriksha-ribbons-layer" pointerEvents="none">
                        {layout.branchRibbons.map(ribbon => (
                            <g
                                key={ribbon.id}
                                transform={`translate(${ribbon.x}, ${ribbon.y}) rotate(${ribbon.angle})`}
                                className="transition-transform duration-300"
                            >
                                <rect
                                    x={-52}
                                    y={-12}
                                    width={104}
                                    height={24}
                                    rx={12}
                                    fill={isRajashahi ? '#7c2d12' : '#064e3b'}
                                    stroke="#ffd700"
                                    strokeWidth={1.5}
                                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
                                />
                                <text
                                    x={0}
                                    y={1}
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    fill="#fef08a"
                                    fontSize={10}
                                    fontWeight="900"
                                    letterSpacing="0.04em"
                                >
                                    🌿 {ribbon.name} શાખા
                                </text>
                            </g>
                        ))}
                    </g>

                    {/* 7. Foliage & Leaf Medallion Nodes (Family Members) */}
                    <g className="vatvriksha-leaves-layer">
                        {layout.nodes.map(node => (
                            <VatvrikshaLeafNode
                                key={node.id}
                                node={node}
                                language={language}
                                theme={theme}
                                isSelected={selectedNodeId === node.id}
                                isHighlighted={activeGlowingSet.has(node.id)}
                                canEdit={canEdit}
                                onViewDetails={onViewDetails}
                                onEditPerson={onEditPerson}
                                onAddChild={onAddChild}
                                onKinshipSelect={onKinshipSelect}
                                onHoverEnter={handleHoverEnter}
                                onHoverLeave={handleHoverLeave}
                            />
                        ))}
                    </g>
                </g>
            </svg>

            {/* Bottom-Right Floating Navigation HUD Controls */}
            <div className="absolute bottom-6 right-6 z-30 flex flex-col gap-2 pointer-events-auto">
                {/* Poster Export Button */}
                <button
                    onClick={handleDownloadPoster}
                    disabled={isExporting}
                    className="p-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white shadow-xl flex items-center justify-center gap-2 text-xs font-bold transition-transform active:scale-95 disabled:opacity-50"
                    title="Download High-Res Wall Art Poster (A3/A2)"
                >
                    <Download size={18} />
                    <span className="hidden sm:inline">
                        {isExporting ? 'Generating Poster…' : 'Export Poster (HD)'}
                    </span>
                </button>

                {/* Zoom & Fit Tools */}
                <div className="flex flex-col bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl p-1 shadow-xl border border-gray-200/60 dark:border-slate-800/80 text-gray-700 dark:text-gray-200">
                    <button
                        onClick={() => setScale(s => Math.min(s * 1.25, 2.5))}
                        className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                        title="Zoom In"
                    >
                        <ZoomIn size={18} />
                    </button>
                    <button
                        onClick={() => setScale(s => Math.max(s * 0.8, 0.15))}
                        className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                        title="Zoom Out"
                    >
                        <ZoomOut size={18} />
                    </button>
                    <div className="border-t border-gray-100 dark:border-slate-800 my-0.5"></div>
                    <button
                        onClick={centerTree}
                        className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-blue-600 dark:text-blue-400"
                        title="Fit Full Tree"
                    >
                        <Maximize2 size={18} />
                    </button>
                </div>
            </div>

            {/* Bottom-Left Quick Legend */}
            <div className="hidden md:flex items-center gap-3 absolute bottom-6 left-6 z-20 px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-gray-200/60 dark:border-slate-800 text-xs font-bold text-gray-600 dark:text-gray-300 shadow-md pointer-events-none">
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                    <span>પુરુષ (Male)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-600"></span>
                    <span>મહિલા (Female)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-600"></span>
                    <span>દિવંગત (🕊️ Memorial)</span>
                </div>
            </div>
        </div>
    );
};
