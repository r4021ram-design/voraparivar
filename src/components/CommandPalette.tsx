import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, X, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import type { Node } from 'reactflow';
import type { Person } from '../types/person';
import type { Language } from '../i18n';
import { translations, getTranslatedContent } from '../i18n';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    nodes: Node[];
    onFocusNode: (nodeId: string) => void;
    language?: Language;
    theme?: string;
}

export default function CommandPalette({
    isOpen,
    onClose,
    nodes,
    onFocusNode,
    language = 'EN',
    theme,
}: CommandPaletteProps) {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const t = translations[language];

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    const handleClose = useCallback(() => {
        setQuery('');
        setSelectedIndex(0);
        onClose();
    }, [onClose]);

    // Translation helper
    const getTranslatedName = (p: Person) => {
        if (p.translations?.[language]?.name) return p.translations[language].name;
        return getTranslatedContent(p.name, language);
    };

    const getTranslatedOccupation = (p: Person) => {
        if (!p.occupation) return undefined;
        if (p.translations?.[language]?.occupation) return p.translations[language].occupation;
        return getTranslatedContent(p.occupation, language);
    };

    // Filter results
    const results = useMemo(() => {
        if (nodes.length === 0) return [];
        const q = query.trim().toLowerCase();

        return nodes
            .map(n => n.data.person as Person)
            .filter(p => {
                if (!q) return true;
                const matchesName = p.name.toLowerCase().includes(q) ||
                    (p.translations?.EN?.name || '').toLowerCase().includes(q) ||
                    (p.translations?.HI?.name || '').toLowerCase().includes(q) ||
                    (p.translations?.GU?.name || '').toLowerCase().includes(q);

                const matchesOccupation = (p.occupation || '').toLowerCase().includes(q) ||
                    (p.translations?.EN?.occupation || '').toLowerCase().includes(q) ||
                    (p.translations?.HI?.occupation || '').toLowerCase().includes(q);

                const matchesSpouse = (p.spouse || '').toLowerCase().includes(q) ||
                    (p.translations?.EN?.spouse || '').toLowerCase().includes(q) ||
                    (p.translations?.HI?.spouse || '').toLowerCase().includes(q) ||
                    (p.translations?.GU?.spouse || '').toLowerCase().includes(q);

                const matchesGen = `gen ${p.generation}`.includes(q) || `generation ${p.generation}`.includes(q);

                return matchesName || matchesOccupation || matchesSpouse || matchesGen;
            })
            .slice(0, 15);
    }, [nodes, query]);

    // Handle Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                handleClose();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1 < results.length ? prev + 1 : 0));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 >= 0 ? prev - 1 : results.length - 1));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (results[selectedIndex]) {
                    onFocusNode(results[selectedIndex].id);
                    handleClose();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, selectedIndex, onFocusNode, handleClose]);

    // Scroll active item into view
    useEffect(() => {
        if (listRef.current) {
            const activeElement = listRef.current.children[selectedIndex] as HTMLElement;
            if (activeElement) {
                activeElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[220] flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div
                className={clsx(
                    "w-full max-w-xl rounded-2xl shadow-2xl border overflow-hidden flex flex-col animate-in zoom-in-95 duration-150",
                    theme === 'rajashahi'
                        ? "bg-[#fffdf8] border-[#ffd700]"
                        : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800"
                )}
            >
                {/* Search Bar Input */}
                <div className="relative flex items-center px-4 py-3.5 border-b border-gray-100 dark:border-slate-800">
                    <Search size={20} className="text-blue-500 shrink-0 mr-3" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                        placeholder={language === 'HI' ? 'नाम, पीढ़ी या व्यवसाय खोजें...' : language === 'GU' ? 'નામ, પેઢી અથવા વ્યવસાય શોધો...' : 'Search by name, occupation, or generation...'}
                        className="w-full bg-transparent text-base outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 mr-2"
                        >
                            <X size={16} />
                        </button>
                    )}
                    <span className="hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded border border-gray-200 dark:border-slate-700 text-gray-400 bg-gray-50 dark:bg-slate-800">
                        ESC
                    </span>
                </div>

                {/* Results List */}
                <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2 flex flex-col gap-1">
                    {results.length > 0 ? (
                        results.map((person, idx) => {
                            const isSelected = idx === selectedIndex;
                            const isFemale = person.gender === 'FEMALE';
                            const translatedName = getTranslatedName(person);
                            const translatedOcc = getTranslatedOccupation(person);

                            return (
                                <button
                                    key={person.id}
                                    onClick={() => {
                                        onFocusNode(person.id);
                                        onClose();
                                    }}
                                    onMouseEnter={() => setSelectedIndex(idx)}
                                    className={clsx(
                                        "w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-left transition-colors",
                                        isSelected
                                            ? "bg-blue-50 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100"
                                            : "hover:bg-gray-50 dark:hover:bg-slate-800/60 text-gray-700 dark:text-gray-200"
                                    )}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        {/* Thumbnail / Monogram */}
                                        <div className={clsx(
                                            "w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm",
                                            isFemale ? "bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-300" : "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300"
                                        )}>
                                            {person.photoUrl ? (
                                                <img src={person.photoUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                <span>{person.name.trim().slice(0, 2).toUpperCase()}</span>
                                            )}
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm truncate">{translatedName}</span>
                                                {person.dateOfDeath && (
                                                    <span className="text-[10px] text-gray-400">🕊️</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                                <span>Gen {person.generation}</span>
                                                {person.spouse && (
                                                    <span>• {t.spouse}: {person.spouse}</span>
                                                )}
                                                {translatedOcc && (
                                                    <span>• {translatedOcc}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <ChevronRight size={16} className={clsx(
                                        "shrink-0 ml-2 transition-transform",
                                        isSelected ? "text-blue-500 translate-x-0.5" : "text-gray-300 dark:text-slate-600"
                                    )} />
                                </button>
                            );
                        })
                    ) : (
                        <div className="py-10 text-center text-sm text-gray-400">
                            {t.noOneFound || 'No family members found'}
                        </div>
                    )}
                </div>

                {/* Footer hints */}
                <div className="px-4 py-2 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-gray-400">
                    <div className="flex items-center gap-3">
                        <span><kbd className="font-mono bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-600">↑↓</kbd> Navigate</span>
                        <span><kbd className="font-mono bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-600">↵</kbd> Jump to person</span>
                    </div>
                    <span>{results.length} results</span>
                </div>
            </div>
        </div>
    );
}
