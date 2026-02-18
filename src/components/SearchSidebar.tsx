import { useState, useMemo } from 'react';
import { Search, X, User, Briefcase, ChevronRight, Filter } from 'lucide-react';
import type { Node } from 'reactflow';
import type { Person } from '../types';
import { translations, type Language, getTranslatedContent } from '../i18n';

interface SearchSidebarProps {
    nodes: Node[];
    onFocusNode: (nodeId: string) => void;
    isOpen: boolean;
    onClose: () => void;
    language?: Language;
}

export default function SearchSidebar({ nodes, onFocusNode, isOpen, onClose, language = 'EN' }: SearchSidebarProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterGender, setFilterGender] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL');
    const [filterGenRange, setFilterGenRange] = useState({ min: 1, max: 15 });
    const t = translations[language];

    const maxGen = useMemo(() => {
        if (nodes.length === 0) return 15;
        return Math.max(...nodes.map(n => (n.data.person as Person).generation || 1), 1);
    }, [nodes]);

    const searchResults = useMemo(() => {
        if (!searchQuery && filterGender === 'ALL' && filterGenRange.min === 1 && filterGenRange.max === 15) return [];

        return nodes.filter(node => {
            const person = node.data.person as Person;
            const matchesSearch = !searchQuery ||
                person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (person.occupation?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (person.id.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesGender = filterGender === 'ALL' || person.gender === filterGender;
            const matchesGen = person.generation >= filterGenRange.min && person.generation <= filterGenRange.max;

            return matchesSearch && matchesGender && matchesGen;
        });
    }, [nodes, searchQuery, filterGender, filterGenRange]);

    if (!isOpen) return null;

    return (
        <div className="absolute top-0 right-0 w-80 h-full bg-white/95 dark:bg-slate-900/95 rajashahi:bg-[#fff9f0]/95 backdrop-blur-md shadow-2xl z-[60] flex flex-col border-l border-gray-200 dark:border-slate-800 rajashahi:border-[#ffd700]/30 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 rajashahi:text-[#800000] flex items-center gap-2">
                    <Search size={20} className="text-blue-600 dark:text-blue-400 rajashahi:text-[#800000]" />
                    {t.findPerson}
                </h2>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-500 dark:text-gray-400"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Controls */}
            <div className="p-4 space-y-6 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                {/* Search Input */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder={`${t.findPerson}...`}
                        className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all text-sm outline-none dark:text-gray-200"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                </div>

                {/* Gender Filters */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t.relation}</label>
                    <div className="flex gap-2">
                        {(['ALL', 'MALE', 'FEMALE'] as const).map(g => (
                            <button
                                key={g}
                                onClick={() => setFilterGender(g)}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${filterGender === g ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                            >
                                {g === 'ALL' ? t.all : g === 'MALE' ? t.male : t.female}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Generation Filter */}
                <div className="space-y-3">
                    <div className="flex justify-between items-baseline">
                        <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t.generations}</label>
                        <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                            {filterGenRange.min} to {filterGenRange.max}
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex-1 space-y-1">
                            <span className="text-[9px] text-gray-400 dark:text-gray-500">Min</span>
                            <input
                                type="range"
                                min="1"
                                max={maxGen}
                                value={filterGenRange.min}
                                onChange={(e) => setFilterGenRange(prev => ({ ...prev, min: Math.min(parseInt(e.target.value), prev.max) }))}
                                className="w-full h-1.5 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                        </div>
                        <div className="flex-1 space-y-1">
                            <span className="text-[9px] text-gray-400 dark:text-gray-500">Max</span>
                            <input
                                type="range"
                                min="1"
                                max={maxGen}
                                value={filterGenRange.max}
                                onChange={(e) => setFilterGenRange(prev => ({ ...prev, max: Math.max(parseInt(e.target.value), prev.min) }))}
                                className="w-full h-1.5 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Area */}
            <div className="flex-1 overflow-y-auto px-2 pb-4 pt-4 custom-scrollbar bg-gray-50/30 dark:bg-slate-950/30">
                {searchResults.length > 0 ? (
                    <div className="space-y-1">
                        <div className="px-3 py-2 flex justify-between items-center">
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                {t.results} ({searchResults.length})
                            </p>
                            {(searchQuery || filterGender !== 'ALL' || filterGenRange.min !== 1 || filterGenRange.max !== 15) && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setFilterGender('ALL');
                                        setFilterGenRange({ min: 1, max: 15 });
                                    }}
                                    className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline"
                                >
                                    {t.reset}
                                </button>
                            )}
                        </div>
                        {searchResults.map((node) => {
                            const person = node.data.person as Person;
                            return (
                                <button
                                    key={node.id}
                                    onClick={() => onFocusNode(node.id)}
                                    className="w-full p-3 flex items-center gap-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 group transition-all text-left border border-transparent hover:border-blue-100 dark:hover:border-blue-900 shadow-sm hover:shadow-md bg-white dark:bg-slate-800 mb-2"
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-inner ${person.gender === 'FEMALE' ? 'bg-pink-400' : 'bg-blue-400'}`}>
                                        {person.photoUrl ? (
                                            <img src={person.photoUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <User size={20} />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-800 dark:text-gray-200 rajashahi:text-[#800000] text-sm truncate group-hover:text-blue-700 dark:group-hover:text-blue-400">
                                            {person.name}
                                        </h3>
                                        <div className="flex flex-wrap gap-x-2 gap-y-1 mt-0.5">
                                            <span className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 rajashahi:text-amber-800">
                                                <Briefcase size={10} />
                                                {getTranslatedContent(person.occupation, language)}
                                            </span>
                                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 rounded-md font-medium">
                                                {t.generations} {person.generation}
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-8 text-center space-y-4">
                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto text-blue-200 dark:text-blue-800">
                            <Filter size={32} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-gray-500 dark:text-gray-400 font-medium whitespace-pre-wrap">{searchQuery || filterGender !== 'ALL' || filterGenRange.min !== 1 || filterGenRange.max !== 15 ? t.noOneFound : t.searchTheTree}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{searchQuery || filterGender !== 'ALL' || filterGenRange.min !== 1 || filterGenRange.max !== 15 ? t.adjustFilters : t.searchDescription}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
