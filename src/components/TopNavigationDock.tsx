import { useState, useRef, useEffect } from 'react';
import {
    Search,
    GitFork,
    Calendar,
    Moon,
    Sun,
    Crown,
    Download,
    RotateCcw,
    LogOut,
    ChevronDown,
    Undo,
    Redo,
    Layers,
    Printer,
    FileJson,
    Image,
    FileText,
    Building2,
    Shield,
    Plus,
} from 'lucide-react';
import clsx from 'clsx';
import type { Language } from '../i18n';
import { translations } from '../i18n';
import type { UserData } from '../types/auth';
import type { Theme } from '../types/ui';
import type { TreeStatistics } from '../features/family-tree/utils/treeTransforms';
import type { Family } from '../features/families/types';

interface TopNavigationDockProps {
    stats: TreeStatistics;
    user: UserData;
    language: Language;
    setLanguage: (lang: Language) => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
    onOpenSearch: () => void;
    onOpenKinship: () => void;
    onToggleTimeline: () => void;
    onFocusRoot: () => void;
    onSetGenDepth: (depth: number) => void;
    currentGenDepth: number;
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    onExportJSON: () => void;
    onExportImage: () => void;
    onExportPDF: () => void;
    onPrint: () => void;
    onReset: () => void;
    onLogout: () => void;
    families?: Family[];
    currentFamilyId?: string;
    onSelectFamily?: (familyId: string) => void;
    onOpenAdminModal?: () => void;
    viewMode?: 'flow' | 'vatvriksha';
    onToggleViewMode?: (mode: 'flow' | 'vatvriksha') => void;
}

export default function TopNavigationDock({
    stats,
    user,
    language,
    setLanguage,
    theme,
    setTheme,
    onOpenSearch,
    onOpenKinship,
    onToggleTimeline,
    onFocusRoot,
    onSetGenDepth,
    currentGenDepth,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onExportJSON,
    onExportImage,
    onExportPDF,
    onPrint,
    onReset,
    onLogout,
    families,
    currentFamilyId,
    onSelectFamily,
    onOpenAdminModal,
    viewMode = 'flow',
    onToggleViewMode,
}: TopNavigationDockProps) {
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [isGenMenuOpen, setIsGenMenuOpen] = useState(false);
    const [isFamilyMenuOpen, setIsFamilyMenuOpen] = useState(false);
    const exportRef = useRef<HTMLDivElement>(null);
    const genRef = useRef<HTMLDivElement>(null);
    const familyRef = useRef<HTMLDivElement>(null);

    const t = translations[language];

    // Close popups on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (exportRef.current && !exportRef.current.contains(e.target as HTMLElement)) {
                setIsExportOpen(false);
            }
            if (genRef.current && !genRef.current.contains(e.target as HTMLElement)) {
                setIsGenMenuOpen(false);
            }
            if (familyRef.current && !familyRef.current.contains(e.target as HTMLElement)) {
                setIsFamilyMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="absolute top-3 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl pointer-events-auto">
            <div className={clsx(
                "flex items-center justify-between gap-2 px-3 py-2 rounded-2xl shadow-xl backdrop-blur-md border transition-all duration-300",
                theme === 'rajashahi'
                    ? "bg-[#fffdf8]/90 border-[#ffd700]/60 shadow-[0_10px_30px_rgba(128,0,0,0.15)] text-gray-900"
                    : "bg-white/85 dark:bg-slate-900/85 border-white/50 dark:border-slate-800/80 shadow-black/5 text-gray-900 dark:text-gray-100"
            )}>
                {/* Left: Brand & Stats */}
                <div className="flex items-center gap-2 sm:gap-2.5">
                    <button
                        onClick={onFocusRoot}
                        className="flex items-center gap-2 text-left group transition-transform active:scale-95"
                        title="Focus on Root Ancestor"
                    >
                        <div className={clsx(
                            "w-8 h-8 rounded-xl flex items-center justify-center font-black shadow-sm shrink-0",
                            theme === 'rajashahi'
                                ? "bg-[#800000] text-[#ffd700]"
                                : "bg-blue-600 text-white"
                        )}>
                            {families?.find(f => f.id === currentFamilyId)?.name.charAt(0) || 'व'}
                        </div>
                        <div className="hidden sm:flex flex-col leading-none">
                            <span className={clsx(
                                "font-black text-sm tracking-tight max-w-[130px] truncate",
                                theme === 'rajashahi' ? "text-[#800000]" : "text-gray-900 dark:text-white"
                            )}>
                                {families?.find(f => f.id === currentFamilyId)?.name || 'વોરા પરિવાર'}
                            </span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                                Family Tree
                            </span>
                        </div>
                    </button>

                    {/* Family Selector for Admin */}
                    {user.role === 'ADMIN' && families && families.length > 0 && (
                        <div className="relative" ref={familyRef}>
                            <button
                                onClick={() => setIsFamilyMenuOpen(!isFamilyMenuOpen)}
                                className={clsx(
                                    "flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all border shadow-xs",
                                    theme === 'rajashahi'
                                        ? "bg-[#fffdf8] border-[#ffd700] text-[#800000] hover:bg-[#fff9e6]"
                                        : "bg-gray-100/90 dark:bg-slate-800/90 hover:bg-gray-200/90 dark:hover:bg-slate-700/90 border-gray-200/80 dark:border-slate-700/80 text-gray-800 dark:text-gray-200"
                                )}
                                title="Switch Family Tree"
                            >
                                <Building2 size={13} className="text-amber-500 shrink-0" />
                                <span className="max-w-[80px] sm:max-w-[120px] truncate">
                                    {families.find(f => f.id === currentFamilyId)?.name || 'Families'}
                                </span>
                                <ChevronDown size={12} className="text-gray-400 shrink-0" />
                            </button>

                            {isFamilyMenuOpen && (
                                <div className="absolute top-full mt-1.5 left-0 w-56 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-gray-200 dark:border-slate-800 p-1.5 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150 text-xs">
                                    <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                        Switch Family
                                    </div>
                                    {families.map((fam) => {
                                        const isSelected = fam.id === currentFamilyId;
                                        return (
                                            <button
                                                key={fam.id}
                                                onClick={() => {
                                                    onSelectFamily?.(fam.id);
                                                    setIsFamilyMenuOpen(false);
                                                }}
                                                className={clsx(
                                                    "px-2.5 py-1.5 rounded-xl text-left font-semibold flex items-center justify-between transition-colors",
                                                    isSelected
                                                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold"
                                                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                                                )}
                                            >
                                                <span className="truncate">{fam.name}</span>
                                                {fam.memberCount !== undefined && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-500">
                                                        {fam.memberCount}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                    <div className="border-t border-gray-100 dark:border-slate-800 my-1"></div>
                                    <button
                                        onClick={() => {
                                            onOpenAdminModal?.();
                                            setIsFamilyMenuOpen(false);
                                        }}
                                        className="px-2.5 py-1.5 rounded-xl text-left font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 flex items-center gap-1.5"
                                    >
                                        <Plus size={13} />
                                        <span>Manage Families & Users</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Stats Badge */}
                    <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gray-100/70 dark:bg-slate-800/70 text-[11px] font-bold text-gray-600 dark:text-gray-300 border border-gray-200/50 dark:border-slate-700/50">
                        <span className="text-blue-600 dark:text-blue-400">{stats.totalMembers}</span>
                        <span>{language === 'HI' ? 'सदस्य' : language === 'GU' ? 'સભ્યો' : 'Members'}</span>
                        <span className="text-gray-300 dark:text-slate-600">•</span>
                        <span className="text-amber-600 dark:text-amber-400">{stats.maxGeneration}</span>
                        <span>{language === 'HI' ? 'पीढ़ियाँ' : language === 'GU' ? 'પેઢી' : 'Gens'}</span>
                    </div>
                </div>

                {/* Center: Search & Navigation Tools */}
                <div className="flex items-center gap-1 sm:gap-1.5">
                    {/* View Mode Switcher: Flowchart vs Botanical Vatvriksha */}
                    <div className="flex items-center bg-gray-100/90 dark:bg-slate-800/90 rounded-xl p-0.5 border border-gray-200/60 dark:border-slate-700/60 shadow-xs mr-0.5">
                        <button
                            onClick={() => onToggleViewMode?.('flow')}
                            className={clsx(
                                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                                viewMode === 'flow'
                                    ? (theme === 'rajashahi' ? "bg-[#800000] text-[#ffd700] shadow-sm" : "bg-blue-600 text-white shadow-sm")
                                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                            )}
                            title="Flowchart / Card Grid View (कार्ड व्यू)"
                        >
                            <span>📊</span>
                            <span className="hidden md:inline">{language === 'HI' ? 'कार्ड व्यू' : language === 'GU' ? 'કાર્ડ વ્યૂ' : 'Cards'}</span>
                        </button>
                        <button
                            onClick={() => onToggleViewMode?.('vatvriksha')}
                            className={clsx(
                                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                                viewMode === 'vatvriksha'
                                    ? (theme === 'rajashahi' ? "bg-[#800000] text-[#ffd700] shadow-sm" : "bg-emerald-600 text-white shadow-sm")
                                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                            )}
                            title="Botanical Banyan Tree View (वटवृक्ष दर्शन)"
                        >
                            <span>🌳</span>
                            <span className="hidden md:inline">{language === 'HI' ? 'वटवृक्ष' : language === 'GU' ? 'વટવૃક્ષ' : 'Tree'}</span>
                        </button>
                    </div>

                    {/* Fast Search trigger button */}
                    <button
                        onClick={onOpenSearch}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-100/80 dark:bg-slate-800/80 hover:bg-gray-200/80 dark:hover:bg-slate-700/80 text-gray-700 dark:text-gray-200 text-xs font-semibold transition-all border border-gray-200/60 dark:border-slate-700/60"
                        title="Search Family Members (Ctrl+K)"
                    >
                        <Search size={14} className="text-blue-500" />
                        <span className="hidden sm:inline">
                            {language === 'HI' ? 'खोजें...' : language === 'GU' ? 'શોધો...' : 'Search...'}
                        </span>
                        <kbd className="hidden md:inline font-mono text-[10px] bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-gray-300 dark:border-slate-600 text-gray-400">
                            Ctrl K
                        </kbd>
                    </button>

                    {/* Generation Depth Filter */}
                    <div className="relative" ref={genRef}>
                        <button
                            onClick={() => setIsGenMenuOpen(!isGenMenuOpen)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gray-100/80 dark:bg-slate-800/80 hover:bg-gray-200/80 dark:hover:bg-slate-700/80 text-xs font-bold text-gray-700 dark:text-gray-200 transition-all border border-gray-200/60 dark:border-slate-700/60"
                            title="Filter by Generation Level"
                        >
                            <Layers size={14} className="text-amber-500" />
                            <span className="hidden sm:inline">
                                {currentGenDepth === 0 ? 'All Gens' : `Gen 1–${currentGenDepth}`}
                            </span>
                            <ChevronDown size={12} className="text-gray-400" />
                        </button>

                        {isGenMenuOpen && (
                            <div className="absolute top-full mt-1.5 left-0 w-44 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-gray-200 dark:border-slate-800 p-1.5 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150">
                                <button
                                    onClick={() => {
                                        onSetGenDepth(0);
                                        setIsGenMenuOpen(false);
                                    }}
                                    className={clsx(
                                        "px-2.5 py-1.5 text-xs rounded-xl text-left font-bold flex items-center justify-between",
                                        currentGenDepth === 0
                                            ? "bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                                            : "hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300"
                                    )}
                                >
                                    <span>Expand All ({stats.maxGeneration} Gens)</span>
                                </button>
                                {[3, 4, 5, 6, 7].filter(g => g <= stats.maxGeneration).map(g => (
                                    <button
                                        key={g}
                                        onClick={() => {
                                            onSetGenDepth(g);
                                            setIsGenMenuOpen(false);
                                        }}
                                        className={clsx(
                                            "px-2.5 py-1.5 text-xs rounded-xl text-left font-semibold flex items-center justify-between",
                                            currentGenDepth === g
                                                ? "bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                                                : "hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300"
                                        )}
                                    >
                                        <span>Show up to Gen {g}</span>
                                    </button>
                                ))}
                                <button
                                    onClick={() => {
                                        onSetGenDepth(1);
                                        setIsGenMenuOpen(false);
                                    }}
                                    className="px-2.5 py-1.5 text-xs rounded-xl text-left font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                                >
                                    <span>Collapse to Root (Gen 1)</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Kinship / Rishta Calculator Trigger */}
                    <button
                        onClick={onOpenKinship}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-900/30 dark:to-indigo-900/30 hover:from-blue-500/20 hover:to-indigo-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all border border-blue-200/50 dark:border-blue-800/50"
                        title="Kinship / Relationship Calculator (रिश्ता कैलकुलेटर)"
                    >
                        <GitFork size={14} />
                        <span className="hidden md:inline">
                            {language === 'HI' ? 'रिश्ता' : language === 'GU' ? 'સંબંધ' : 'Kinship'}
                        </span>
                    </button>

                    {/* Timeline toggle */}
                    <button
                        onClick={onToggleTimeline}
                        className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                        title={t.timeline}
                    >
                        <Calendar size={16} />
                    </button>

                    {/* Undo / Redo for Admin */}
                    {user.role === 'ADMIN' && (
                        <div className="hidden lg:flex items-center bg-gray-100/80 dark:bg-slate-800/80 rounded-xl p-0.5 border border-gray-200/50 dark:border-slate-700/50">
                            <button
                                onClick={onUndo}
                                disabled={!canUndo}
                                className={clsx(
                                    "p-1.5 rounded-lg transition-colors",
                                    canUndo ? "text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-slate-700" : "text-gray-300 dark:text-slate-600 cursor-not-allowed"
                                )}
                                title="Undo (Ctrl+Z)"
                            >
                                <Undo size={13} />
                            </button>
                            <button
                                onClick={onRedo}
                                disabled={!canRedo}
                                className={clsx(
                                    "p-1.5 rounded-lg transition-colors",
                                    canRedo ? "text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-slate-700" : "text-gray-300 dark:text-slate-600 cursor-not-allowed"
                                )}
                                title="Redo (Ctrl+Y)"
                            >
                                <Redo size={13} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Right: Language, Theme, Export & User */}
                <div className="flex items-center gap-1 sm:gap-1.5">
                    {/* Language Switcher */}
                    <div className="flex bg-gray-100/80 dark:bg-slate-800/80 rounded-xl p-0.5 border border-gray-200/50 dark:border-slate-700/50 text-[11px] font-bold">
                        {(['EN', 'HI', 'GU'] as Language[]).map(l => (
                            <button
                                key={l}
                                onClick={() => setLanguage(l)}
                                className={clsx(
                                    "px-2 py-1 rounded-lg transition-all",
                                    language === l
                                        ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400"
                                        : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
                                )}
                            >
                                {l}
                            </button>
                        ))}
                    </div>

                    {/* Theme Switcher */}
                    <div className="flex bg-gray-100/80 dark:bg-slate-800/80 rounded-xl p-0.5 border border-gray-200/50 dark:border-slate-700/50">
                        <button
                            onClick={() => setTheme('light')}
                            className={clsx(
                                "p-1.5 rounded-lg transition-all",
                                theme === 'light' ? "bg-white text-amber-500 shadow-sm" : "text-gray-400 hover:text-gray-700"
                            )}
                            title="Light Theme"
                        >
                            <Sun size={14} />
                        </button>
                        <button
                            onClick={() => setTheme('dark')}
                            className={clsx(
                                "p-1.5 rounded-lg transition-all",
                                theme === 'dark' ? "bg-slate-700 text-blue-400 shadow-sm" : "text-gray-400 hover:text-gray-200"
                            )}
                            title="Dark Theme"
                        >
                            <Moon size={14} />
                        </button>
                        <button
                            onClick={() => setTheme('rajashahi')}
                            className={clsx(
                                "p-1.5 rounded-lg transition-all",
                                theme === 'rajashahi' ? "bg-[#800000] text-[#ffd700] shadow-sm" : "text-gray-400 hover:text-[#800000]"
                            )}
                            title="Royal Rajashahi Theme"
                        >
                            <Crown size={14} />
                        </button>
                    </div>

                    {/* Admin Management Button */}
                    {user.role === 'ADMIN' && onOpenAdminModal && (
                        <button
                            onClick={onOpenAdminModal}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-500/30 transition-all active:scale-95 shadow-xs"
                            title="Admin Management Portal"
                        >
                            <Shield size={14} className="text-amber-600 dark:text-amber-400" />
                            <span className="hidden md:inline">Admin Panel</span>
                        </button>
                    )}

                    {/* Export Dropdown Menu */}
                    <div className="relative" ref={exportRef}>
                        <button
                            onClick={() => setIsExportOpen(!isExportOpen)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95"
                            title={t.export}
                        >
                            <Download size={14} />
                            <span className="hidden sm:inline">{t.export}</span>
                        </button>

                        {isExportOpen && (
                            <div className="absolute top-full mt-1.5 right-0 w-48 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-gray-200 dark:border-slate-800 p-1.5 z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150 text-xs">
                                <button
                                    onClick={() => {
                                        onExportJSON();
                                        setIsExportOpen(false);
                                    }}
                                    className="px-3 py-2 rounded-xl text-left font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                                >
                                    <FileJson size={15} className="text-amber-500" />
                                    <span>Download JSON Backup</span>
                                </button>
                                <button
                                    onClick={() => {
                                        onExportImage();
                                        setIsExportOpen(false);
                                    }}
                                    className="px-3 py-2 rounded-xl text-left font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                                >
                                    <Image size={15} className="text-blue-500" />
                                    <span>Export PNG Image</span>
                                </button>
                                <button
                                    onClick={() => {
                                        onExportPDF();
                                        setIsExportOpen(false);
                                    }}
                                    className="px-3 py-2 rounded-xl text-left font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                                >
                                    <FileText size={15} className="text-red-500" />
                                    <span>Export PDF Document</span>
                                </button>
                                <button
                                    onClick={() => {
                                        onPrint();
                                        setIsExportOpen(false);
                                    }}
                                    className="px-3 py-2 rounded-xl text-left font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                                >
                                    <Printer size={15} className="text-emerald-500" />
                                    <span>Print Family Tree</span>
                                </button>
                                <div className="border-t border-gray-100 dark:border-slate-800 my-0.5"></div>
                                <button
                                    onClick={() => {
                                        onReset();
                                        setIsExportOpen(false);
                                    }}
                                    className="px-3 py-2 rounded-xl text-left font-semibold hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center gap-2"
                                >
                                    <RotateCcw size={15} />
                                    <span>{t.reset || 'Reset to Default'}</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={onLogout}
                        className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title={t.logout}
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </header>
    );
}
