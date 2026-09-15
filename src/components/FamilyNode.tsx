import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Heart, Trash2, Plus, Minus, GitFork, Eye } from 'lucide-react';
import clsx from 'clsx';
import type { Language } from '../i18n';
import { translations, getTranslatedContent } from '../i18n';
import type { FamilyNodeData } from '../features/family-tree/types';

const MonogramAvatar = ({ name, isFemale, photoUrl, theme }: { name?: string; isFemale: boolean; photoUrl?: string; theme?: string }) => {
    if (photoUrl) {
        return (
            <img
                src={photoUrl}
                alt={name || ''}
                className="w-11 h-11 rounded-full object-cover shadow-sm ring-2 ring-white/50 dark:ring-slate-800 shrink-0"
            />
        );
    }

    const initials = (name || '?').trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();

    return (
        <div
            className={clsx(
                "w-11 h-11 rounded-full flex items-center justify-center font-black text-xs tracking-tight shadow-md select-none shrink-0",
                theme === 'rajashahi'
                    ? "bg-gradient-to-br from-[#ffd700] to-[#b8860b] text-[#800000] border-2 border-[#800000]/20"
                    : isFemale
                    ? "bg-gradient-to-br from-pink-400 to-rose-600 text-white shadow-pink-200/50 dark:shadow-rose-950/40"
                    : "bg-gradient-to-br from-blue-500 to-indigo-700 text-white shadow-blue-200/50 dark:shadow-indigo-950/40"
            )}
        >
            <span>{initials}</span>
        </div>
    );
};

const formatLifeSpan = (dob?: string, dod?: string) => {
    const b = dob ? dob.split('-')[0] : null;
    const d = dod ? dod.split('-')[0] : null;
    if (b && d) return `${b} – ${d}`;
    if (d) return `† ${d}`;
    if (b) return `b. ${b}`;
    return null;
};

const FamilyNode = ({ data, isConnectable }: NodeProps<FamilyNodeData>) => {
    const {
        person,
        onEdit,
        onDelete,
        language = 'EN',
        theme,
        fontScale,
        onAddChild,
        onToggleExpand,
        onAddParent,
        onViewDetails,
        onKinshipSelect,
        isHighlighted,
        isDimmed,
        isSelected,
        childOrder,
        hasSiblings,
    } = data;

    const t = translations[language as Language];
    const isFemale = person.gender === 'FEMALE';
    const lifeSpan = formatLifeSpan(person.dateOfBirth, person.dateOfDeath);
    const spouseLifeSpan = formatLifeSpan(person.spouseDateOfBirth, person.spouseDateOfDeath);
    const childrenCount = person.children ? person.children.length : 0;

    // Translation helper for content
    const translateContent = (text?: string, field?: 'name' | 'occupation' | 'relation' | 'spouse') => {
        if (field && person.translations?.[language]?.[field]) {
            return person.translations[language][field];
        }
        return getTranslatedContent(text, language);
    };

    return (
        <div
            className={clsx(
                "relative group transition-all duration-300 rounded-2xl border-2 overflow-hidden shadow-lg hover:shadow-2xl",
                isHighlighted && "ring-4 ring-yellow-400 dark:ring-yellow-500 scale-[1.03] shadow-2xl z-40",
                isSelected && "ring-4 ring-blue-500 scale-[1.03] shadow-2xl z-40",
                isDimmed && "opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300",
                theme === 'rajashahi' ? "border-[#ffd700] shadow-[0_0_20px_rgba(255,215,0,0.25)] bg-[#fff9f0]" :
                    person.generation === 1 ? "border-amber-600 dark:border-amber-500" :
                        person.generation === 2 ? "border-orange-500 dark:border-orange-400" :
                            person.generation === 3 ? "border-red-600 dark:border-red-500" :
                                person.generation === 4 ? "border-emerald-600 dark:border-emerald-500" :
                                    person.generation === 5 ? "border-blue-600 dark:border-blue-500" :
                                        person.generation === 6 ? "border-orange-600 dark:border-orange-500" :
                                            person.generation === 7 ? "border-teal-600 dark:border-teal-500" :
                                                person.generation === 8 ? "border-indigo-600 dark:border-indigo-500" :
                                                    "border-pink-600 dark:border-pink-500",
                "w-[290px] family-node-card cursor-pointer"
            )}
            onClick={(e) => {
                e.stopPropagation();
                onViewDetails?.(person);
            }}
        >
            {/* Target Handle */}
            <Handle type="target" position={Position.Top} className="!bg-gray-400 dark:!bg-slate-600 !w-3 !h-3" />

            {/* Ancestral Expansion Button (Add Father to Root) */}
            {person.generation === 1 && onAddParent && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onAddParent();
                    }}
                    className={clsx(
                        "absolute -top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-0.5 rounded-full border-2 flex items-center justify-center gap-1 transition-all shadow-lg text-[10px] font-black uppercase tracking-tighter",
                        theme === 'rajashahi' ? "bg-[#800000] border-[#ffd700] text-[#ffd700]" : "bg-white dark:bg-slate-800 border-blue-500 text-blue-500",
                        "hover:scale-105 active:scale-95"
                    )}
                >
                    <Plus size={12} strokeWidth={3} />
                    {t.addFather}
                </button>
            )}

            {/* Header Strip */}
            <div className={clsx(
                "px-3.5 py-2 flex justify-between items-center text-white font-bold transition-colors",
                theme === 'rajashahi' ? "bg-gradient-to-r from-[#800000] to-[#a52a2a] border-b border-[#ffd700]/30" :
                    person.generation === 1 ? "bg-amber-600" :
                        person.generation === 2 ? "bg-orange-500" :
                            person.generation === 3 ? "bg-red-600" :
                                person.generation === 4 ? "bg-emerald-600" :
                                    person.generation === 5 ? "bg-blue-600" :
                                        person.generation === 6 ? "bg-orange-600" :
                                            person.generation === 7 ? "bg-teal-600" :
                                                person.generation === 8 ? "bg-indigo-600" :
                                                    "bg-pink-600"
            )}>
                <div className="flex items-center gap-1.5 min-w-0">
                    {/* Child Order */}
                    {hasSiblings && childOrder && (
                        <span
                            title={`Child #${childOrder}`}
                            className={clsx(
                                "flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black shadow-inner shrink-0",
                                theme === 'rajashahi' ? "bg-[#ffd700] text-[#800000]" : "bg-white/25 text-white"
                            )}
                        >
                            {childOrder}
                        </span>
                    )}

                    {/* Generation Pill */}
                    <span className="text-[10px] font-black uppercase tracking-wider bg-black/15 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {t.generations} {person.generation}
                    </span>

                    {/* Memorial / Late Badge */}
                    {person.dateOfDeath && (
                        <span title="Late / Swargiya (स्व.)" className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white font-normal flex items-center gap-0.5">
                            🕊️ <span className="hidden sm:inline text-[9px] font-medium">{language === 'HI' ? 'स्व.' : language === 'GU' ? 'સ્વ.' : 'Late'}</span>
                        </span>
                    )}
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                    {person.spouse && <Heart size={13} className="text-white fill-white/30" />}

                    {/* Kinship / Rishta action */}
                    {onKinshipSelect && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onKinshipSelect(person);
                            }}
                            title="Calculate Relationship (रिश्ता)"
                            className="p-1 rounded bg-white/15 hover:bg-white/30 transition-colors text-white"
                        >
                            <GitFork size={12} />
                        </button>
                    )}

                    {/* Quick View */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails?.(person);
                        }}
                        title="View Details"
                        className="p-1 rounded bg-white/15 hover:bg-white/30 transition-colors text-white"
                    >
                        <Eye size={12} />
                    </button>

                    {onEdit && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(person);
                            }}
                            title="Edit"
                            className="bg-white/15 p-1 rounded hover:bg-white/30 transition-colors text-white"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                        </button>
                    )}

                    {onDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(person.id);
                            }}
                            title="Delete"
                            className="p-1 rounded text-white/80 hover:text-white hover:bg-red-600/40 transition-colors"
                        >
                            <Trash2 size={12} />
                        </button>
                    )}
                </div>
            </div>

            {/* Main Card Body */}
            <div className={clsx(
                "p-3.5 flex flex-col gap-2.5 transition-colors duration-300",
                theme === 'rajashahi' ? (isFemale ? "bg-[#fff2f2]/60" : "bg-[#f5f8ff]/60") :
                    isFemale
                        ? "bg-rose-50/70 dark:bg-rose-950/20"
                        : "bg-blue-50/70 dark:bg-blue-950/20"
            )}>
                {/* Primary Member */}
                {(() => {
                    const primaryName = translateContent(person.name, 'name');
                    return (
                        <div className="flex items-center gap-3">
                            <MonogramAvatar name={primaryName} isFemale={isFemale} photoUrl={person.photoUrl} theme={theme} />

                            <div className="min-w-0 flex-1">
                                <div className="flex items-baseline justify-between gap-1">
                                    <h3 className={clsx(
                                        "font-black truncate leading-tight",
                                        theme === 'rajashahi' ? "text-[#800000]" : "text-gray-900 dark:text-gray-100",
                                        fontScale === 'sm' ? 'text-base' : fontScale === 'md' ? 'text-lg' : 'text-xl'
                                    )}>
                                        {primaryName}
                                    </h3>
                                </div>

                                {/* Lifespan & Occupation */}
                                <div className="flex flex-col gap-0.5 mt-0.5">
                                    {lifeSpan && (
                                        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                                            {lifeSpan}
                                        </span>
                                    )}
                                    {person.occupation && (
                                        <p className={clsx(
                                            "text-xs font-medium italic truncate",
                                            theme === 'rajashahi' ? "text-amber-800" : "text-gray-600 dark:text-gray-400"
                                        )}>
                                            {translateContent(person.occupation, 'occupation')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Spouse Section */}
                {person.spouse && (() => {
                    const spouseName = translateContent(person.spouse, 'spouse');
                    return (
                        <div className="flex items-center gap-2.5 pt-2.5 border-t border-gray-200/50 dark:border-white/10">
                            <MonogramAvatar name={spouseName} isFemale={!isFemale} photoUrl={person.spousePhotoUrl} theme={theme} />

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter">
                                        {t.spouse || 'Spouse'}
                                    </span>
                                    {spouseLifeSpan && (
                                        <span className="text-[10px] text-gray-400">
                                            • {spouseLifeSpan}
                                        </span>
                                    )}
                                </div>

                                <h4 className={clsx(
                                    "font-bold truncate leading-tight",
                                    theme === 'rajashahi' ? "text-[#800000]" : "text-gray-800 dark:text-gray-200",
                                    fontScale === 'sm' ? 'text-sm' : fontScale === 'md' ? 'text-base' : 'text-lg'
                                )}>
                                    {spouseName}
                                </h4>

                                {person.spouseOccupation && (
                                    <p className="text-[11px] italic truncate text-gray-500 dark:text-gray-400">
                                        {translateContent(person.spouseOccupation)}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* Bottom Section: Add Child Actions (Admin/Standard) */}
            {onAddChild && (
                <div className="flex border-t border-gray-100 dark:border-white/5 divide-x divide-gray-100 dark:divide-white/5 bg-gray-50/70 dark:bg-black/20 text-[11px] font-black uppercase">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddChild(person.id, 'son');
                        }}
                        className="flex-1 py-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-all flex items-center justify-center gap-1"
                    >
                        <span>+ {t.son}</span>
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddChild(person.id, 'daughter');
                        }}
                        className="flex-1 py-1.5 text-pink-600 dark:text-pink-400 hover:bg-pink-100/50 dark:hover:bg-pink-900/30 transition-all flex items-center justify-center gap-1"
                    >
                        <span>+ {t.daughter}</span>
                    </button>
                </div>
            )}

            {/* Bottom Handle (Connection) */}
            <Handle
                type="source"
                position={Position.Bottom}
                isConnectable={isConnectable}
                className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white dark:!border-slate-800"
            />

            {/* Expand/Collapse Toggle Badge with Children Count */}
            {childrenCount > 0 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleExpand?.(person.id);
                    }}
                    className={clsx(
                        "absolute -bottom-3.5 left-1/2 -translate-x-1/2 z-20 px-2.5 py-0.5 rounded-full border-2 flex items-center justify-center gap-1 transition-all shadow-md text-[11px] font-bold",
                        theme === 'rajashahi'
                            ? "bg-[#800000] border-[#ffd700] text-[#ffd700]"
                            : person.isCollapsed
                            ? "bg-amber-500 border-white text-white dark:border-slate-900"
                            : "bg-white dark:bg-slate-800 border-blue-500 text-blue-600 dark:text-blue-400",
                        "hover:scale-105 active:scale-95"
                    )}
                    title={person.isCollapsed ? t.expand : t.collapse}
                >
                    {person.isCollapsed ? <Plus size={11} strokeWidth={3} /> : <Minus size={11} strokeWidth={3} />}
                    <span>{childrenCount}</span>
                </button>
            )}
        </div>
    );
};

export default memo(FamilyNode);
