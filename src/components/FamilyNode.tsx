import { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { User, Heart, Trash2, Plus, Minus } from 'lucide-react';
import clsx from 'clsx';
import type { Language } from '../i18n'; // Keep this for cast
import DetailsTooltip from './DetailsTooltip';
import { translations, getTranslatedContent } from '../i18n';

const FamilyNode = ({ data, isConnectable }: any) => {
    const { person, onEdit, onDelete, language = 'EN', theme, fontScale, onAddChild, onToggleExpand, onAddParent } = data;
    const t = translations[language as Language];

    const [isHovered, setIsHovered] = useState(false);
    const isFemale = person.gender === 'FEMALE';

    // Translation helper for content
    const translateContent = (text?: string) => getTranslatedContent(text, language);

    return (
        <div
            className={clsx(
                "relative group transition-all duration-300 rounded-2xl border-2 overflow-hidden shadow-xl",
                theme === 'rajashahi' ? "border-[#ffd700] shadow-[0_0_20px_rgba(255,215,0,0.3)] bg-[#fff9f0]" :
                    person.generation === 1 ? "border-amber-600" :
                        person.generation === 2 ? "border-orange-500" :
                            person.generation === 3 ? "border-red-600" :
                                person.generation === 4 ? "border-emerald-600" :
                                    person.generation === 5 ? "border-blue-600" :
                                        person.generation === 6 ? "border-orange-600" :
                                            person.generation === 7 ? "border-teal-600" :
                                                person.generation === 8 ? "border-indigo-600" :
                                                    "border-pink-600"
            )}
            style={{
                width: 280,
                fontSize: 'calc(1rem * var(--tree-font-scale))'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => setIsHovered(!isHovered)}
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
                        "absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-0.5 rounded-full border-2 flex items-center justify-center gap-1 transition-all shadow-lg text-[10px] font-black uppercase tracking-tighter",
                        theme === 'rajashahi' ? "bg-[#800000] border-[#ffd700] text-[#ffd700]" : "bg-white dark:bg-slate-800 border-blue-500 text-blue-500",
                        "hover:scale-105 active:scale-95"
                    )}
                >
                    <Plus size={12} strokeWidth={3} />
                    {language === 'GU' ? 'પિતા ઉમેરો' : language === 'HI' ? 'पिता जोड़ें' : 'Add Father'}
                </button>
            )}

            <div className={clsx(
                "px-4 py-2 flex justify-between items-center text-white font-bold",
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
                <div className="flex items-center gap-2">
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest opacity-90">{t.generations} {person.generation}</span>
                    {person.relation && (
                        <span className="text-[9px] sm:text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                            {translateContent(person.relation)}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1.5">
                    {person.spouse && <Heart size={14} className="text-white fill-white/20" />}
                    {onDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`${t.delete}? ${person.name}`)) {
                                    onDelete(person.id);
                                }
                            }}
                            className="p-1 rounded-full text-white/70 hover:text-white hover:bg-black/10 transition-colors"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                    {onEdit && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(person);
                            }}
                            className="bg-white/20 p-1 rounded hover:bg-white/40 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                        </button>
                    )}
                </div>
            </div>

            <div className={clsx(
                "p-4 flex flex-col gap-3 transition-colors duration-300",
                theme === 'rajashahi' ? (isFemale ? "bg-pink-50/20" : "bg-blue-50/20") :
                    isFemale
                        ? "bg-red-50/80 dark:bg-rose-950/20"
                        : "bg-blue-50/80 dark:bg-blue-950/20"
            )}>
                {/* Main Person */}
                <div className="flex items-center gap-3">
                    <div className={clsx(
                        "p-1 rounded-full border-2 shrink-0 shadow-inner",
                        isFemale ? "bg-pink-50 border-pink-100 dark:bg-pink-900/30 dark:border-pink-800" : "bg-blue-50 border-blue-100 dark:bg-blue-900/30 dark:border-blue-800"
                    )}>
                        {person.photoUrl ? (
                            <img
                                src={person.photoUrl}
                                alt={person.name}
                                className="w-10 h-10 rounded-full object-cover shadow-sm"
                            />
                        ) : (
                            <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center", isFemale ? "bg-pink-100 dark:bg-pink-800/50" : "bg-blue-100 dark:bg-blue-800/50")}>
                                <User size={22} className={isFemale ? "text-pink-600 dark:text-pink-400" : "text-blue-600 dark:text-blue-400"} />
                            </div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <h3 className={clsx(
                            "font-black truncate leading-tight",
                            theme === 'rajashahi' ? "text-[#800000]" : "text-gray-800 dark:text-gray-100",
                            fontScale === 'sm' ? 'text-lg' : fontScale === 'md' ? 'text-xl' : 'text-2xl'
                        )}>
                            {translateContent(person.name)}
                        </h3>
                        {person.occupation && (
                            <p className={clsx(
                                "text-xs font-medium italic truncate mt-0.5",
                                theme === 'rajashahi' ? "text-amber-800" : "text-gray-500 dark:text-gray-400"
                            )}>
                                {translateContent(person.occupation)}
                            </p>
                        )}
                    </div>
                </div>

                {/* Spouse Section */}
                {person.spouse && (
                    <div className="flex items-center gap-3 pt-3 border-t border-gray-200/40 dark:border-white/5">
                        <div className={clsx(
                            "p-1 rounded-full border-2 shrink-0 shadow-inner",
                            !isFemale ? "bg-pink-50 border-pink-100 dark:bg-pink-900/30 dark:border-pink-800" : "bg-blue-50 border-blue-100 dark:bg-blue-900/30 dark:border-blue-800"
                        )}>
                            {person.spousePhotoUrl ? (
                                <img
                                    src={person.spousePhotoUrl}
                                    alt={person.spouse}
                                    className="w-10 h-10 rounded-full object-cover shadow-sm"
                                />
                            ) : (
                                <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center", !isFemale ? "bg-pink-100 dark:bg-pink-800/50" : "bg-blue-100 dark:bg-blue-800/50")}>
                                    <User size={22} className={!isFemale ? "text-pink-600 dark:text-pink-400" : "text-blue-600 dark:text-blue-400"} />
                                </div>
                            )}
                        </div>
                        <div className="min-w-0">
                            <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block leading-none mb-1">
                                {person.gender === 'MALE' ? t.wife : t.husband}
                            </span>
                            <h3 className={clsx(
                                "font-bold truncate leading-tight",
                                theme === 'rajashahi' ? "text-[#800000]" : "text-gray-800 dark:text-gray-200",
                                fontScale === 'sm' ? 'text-base' : fontScale === 'md' ? 'text-lg' : 'text-xl'
                            )}>
                                {translateContent(person.spouse)}
                            </h3>
                            {person.spouseOccupation && (
                                <p className={clsx(
                                    "text-[11px] italic truncate",
                                    theme === 'rajashahi' ? "text-amber-800" : "text-gray-500 dark:text-gray-400"
                                )}>
                                    {translateContent(person.spouseOccupation)}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {onAddChild && (
                <div className="flex border-t border-gray-100 dark:border-white/5 divide-x divide-gray-100 dark:divide-white/5 bg-gray-50/50 dark:bg-black/10">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddChild(person.id, 'son');
                        }}
                        className="flex-1 py-2 text-[10px] font-black text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all uppercase tracking-tighter"
                    >
                        + {t.son}
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddChild(person.id, 'daughter');
                        }}
                        className="flex-1 py-2 text-[10px] font-black text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all uppercase tracking-tighter"
                    >
                        + {t.daughter}
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

            {/* Expand/Collapse Toggle */}
            {person.children && person.children.length > 0 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleExpand?.(person.id);
                    }}
                    className={clsx(
                        "absolute -bottom-3 left-1/2 -translate-x-1/2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shadow-lg",
                        theme === 'rajashahi' ? "bg-[#800000] border-[#ffd700] text-[#ffd700]" : "bg-white dark:bg-slate-800 border-blue-500 text-blue-500",
                        "hover:scale-110 active:scale-95"
                    )}
                    title={person.isCollapsed ? "Expand" : "Collapse"}
                >
                    {person.isCollapsed ? <Plus size={14} strokeWidth={3} /> : <Minus size={14} strokeWidth={3} />}
                </button>
            )}

            {/* Tooltip */}
            {isHovered && (
                <DetailsTooltip
                    person={person}
                    language={language}
                    theme={theme}
                    fontScale={fontScale}
                />
            )}
        </div>
    );
};

export default memo(FamilyNode);
