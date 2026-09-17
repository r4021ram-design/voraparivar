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

    // 1. Calculate botanical tree geometry
    const layout = useMemo(() => {
        return calculateBotanicalLayout(treeData, highlightedPath);
    }, [treeData, highlightedPath]);

    // 2. Pan and Zoom Transform State
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.85);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isExporting, setIsExporting] = useState(false);

    // Initial center on tree trunk
    const centerTree = useCallback(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        
        // Target initial scale based on bounding box
        const scaleX = (rect.width * 0.9) / layout.bounds.width;
        const scaleY = (rect.height * 0.9) / layout.bounds.height;
        const initScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.35), 1.1);

        const treeCenterX = (layout.bounds.minX + layout.bounds.maxX) / 2;
        const treeCenterY = (layout.bounds.minY + layout.bounds.maxY) / 2;

        setScale(initScale);
        setPan({
            x: rect.width / 2 - treeCenterX * initScale,
            y: rect.height / 2 - treeCenterY * initScale + 40,
        });
    }, [layout]);

    useEffect(() => {
        centerTree();
    }, [centerTree]);

    // 3. Mouse Pan Handlers
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

    // 4. Wheel Zoom
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
        const newScale = Math.min(Math.max(scale * zoomFactor, 0.15), 2.5);

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

    // 5. High-Definition Wall Poster Export
    const handleDownloadPoster = async () => {
        if (!containerRef.current) return;
        setIsExporting(true);

        try {
            // Target the SVG content wrapper
            const svgElement = containerRef.current.querySelector('.vatvriksha-svg-canvas') as HTMLElement;
            if (!svgElement) throw new Error('SVG Canvas element not found');

            const dataUrl = await toPng(svgElement, {
                backgroundColor: isRajashahi ? '#fff9f0' : theme === 'dark' ? '#090d16' : '#f8fafc',
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
                    ? "bg-gradient-to-b from-[#fffcf5] via-[#fff8eb] to-[#f7eed9]"
                    : "bg-gradient-to-b from-slate-50 via-sky-50/30 to-emerald-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
            )}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
        >
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
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                        {layout.nodes.length} પરિવારના પર્ણો (Members) • {layout.branches.length} શાખાઓ
                    </span>
                </div>
            </div>

            {/* Main Infinite SVG Tree Canvas */}
            <svg
                className="vatvriksha-svg-canvas absolute inset-0 w-full h-full pointer-events-auto"
                style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                    transformOrigin: '0 0',
                }}
            >
                <defs>
                    {/* Natural Wooden Bark Gradient */}
                    <linearGradient id="natural-wood-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#45220c" />
                        <stop offset="40%" stopColor="#783e16" />
                        <stop offset="80%" stopColor="#9a5b28" />
                        <stop offset="100%" stopColor="#5a2d0f" />
                    </linearGradient>

                    {/* Royal Gold/Wood Gradient for Rajashahi */}
                    <linearGradient id="royal-wood-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#5c1905" />
                        <stop offset="50%" stopColor="#87290d" />
                        <stop offset="100%" stopColor="#b45309" />
                    </linearGradient>

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
                    <filter id="golden-branch-glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="6" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* 1. Deep Banyan Roots Base & Earth Mound */}
                <g className="vatvriksha-earth-roots" opacity={0.9}>
                    {/* Earth Mound */}
                    <ellipse
                        cx={layout.trunk.baseX}
                        cy={layout.trunk.baseY + 30}
                        rx={160}
                        ry={35}
                        fill={isRajashahi ? '#854d0e' : '#334155'}
                        opacity={0.3}
                    />

                    {/* Sprawling Roots Anchored in the Earth */}
                    {[-120, -70, -30, 30, 70, 120].map((rx, idx) => (
                        <path
                            key={idx}
                            d={`M ${layout.trunk.baseX} ${layout.trunk.baseY} Q ${layout.trunk.baseX + rx * 0.5} ${layout.trunk.baseY + 20} ${layout.trunk.baseX + rx} ${layout.trunk.baseY + 45}`}
                            fill="none"
                            stroke={isRajashahi ? '#5c1905' : '#45220c'}
                            strokeWidth={14 - Math.abs(rx) * 0.06}
                            strokeLinecap="round"
                        />
                    ))}
                </g>

                {/* 2. Ancient Grand Banyan Trunk (Rising from Roots to Root Ancestor) */}
                <g className="vatvriksha-grand-trunk">
                    {/* Trunk Shadow */}
                    <path
                        d={`M ${layout.trunk.baseX - 35} ${layout.trunk.baseY} Q ${layout.trunk.baseX - 25} ${(layout.trunk.baseY + layout.trunk.topY) / 2} ${layout.trunk.topX - 18} ${layout.trunk.topY + 30} L ${layout.trunk.topX + 18} ${layout.trunk.topY + 30} Q ${layout.trunk.baseX + 25} ${(layout.trunk.baseY + layout.trunk.topY) / 2} ${layout.trunk.baseX + 35} ${layout.trunk.baseY} Z`}
                        fill={isRajashahi ? 'url(#royal-wood-gradient)' : 'url(#natural-wood-gradient)'}
                        stroke={isRajashahi ? '#3b0d01' : '#1e1107'}
                        strokeWidth={2}
                    />

                    {/* Vertical Trunk Bark Grain Textures */}
                    {[-15, -5, 5, 15].map((gx, idx) => (
                        <path
                            key={idx}
                            d={`M ${layout.trunk.baseX + gx * 1.5} ${layout.trunk.baseY - 10} Q ${layout.trunk.baseX + gx} ${(layout.trunk.baseY + layout.trunk.topY) / 2} ${layout.trunk.topX + gx * 0.8} ${layout.trunk.topY + 35}`}
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.15)"
                            strokeWidth={2.5}
                        />
                    ))}
                </g>

                {/* 3. Wooden Branches Connecting All Generations */}
                <g className="vatvriksha-branches-layer">
                    {layout.branches.map(branch => (
                        <VatvrikshaBranch
                            key={branch.id}
                            branch={branch}
                            theme={theme}
                        />
                    ))}
                </g>

                {/* 4. Foliage & Leaf Medallion Nodes (Family Members) */}
                <g className="vatvriksha-leaves-layer">
                    {layout.nodes.map(node => (
                        <VatvrikshaLeafNode
                            key={node.id}
                            node={node}
                            language={language}
                            theme={theme}
                            isSelected={selectedNodeId === node.id}
                            isHighlighted={highlightedPath.includes(node.id)}
                            canEdit={canEdit}
                            onViewDetails={onViewDetails}
                            onEditPerson={onEditPerson}
                            onAddChild={onAddChild}
                            onKinshipSelect={onKinshipSelect}
                        />
                    ))}
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
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    <span>पुरुष (Male)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                    <span>महिला (Female)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                    <span>दिवंगत (🕊️ Memorial)</span>
                </div>
            </div>
        </div>
    );
};
