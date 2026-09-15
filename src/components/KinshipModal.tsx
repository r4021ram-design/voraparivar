import { useState, useMemo } from 'react';
import { X, GitFork, CheckCircle2, User, Search, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import type { Person } from '../types/person';
import type { Language } from '../i18n';
import { calculateKinship, type KinshipResult } from '../features/family-tree/utils/kinshipCalculator';

interface KinshipModalProps {
    isOpen: boolean;
    onClose: () => void;
    treeRoot: Person;
    initialPersonA?: Person | null;
    initialPersonB?: Person | null;
    onHighlightLineage: (path: string[]) => void;
    language?: Language;
    theme?: string;
}

export default function KinshipModal({
    isOpen,
    onClose,
    treeRoot,
    initialPersonA,
    initialPersonB,
    onHighlightLineage,
    language = 'EN',
    theme,
}: KinshipModalProps) {
    const [selectedA, setSelectedA] = useState<Person | null>(initialPersonA || null);
    const [selectedB, setSelectedB] = useState<Person | null>(initialPersonB || null);
    const [searchA, setSearchA] = useState('');
    const [searchB, setSearchB] = useState('');
    const [isSelectingA, setIsSelectingA] = useState(false);
    const [isSelectingB, setIsSelectingB] = useState(false);

    // Flatten all people from the tree for quick searching
    const allPeople = useMemo(() => {
        const list: Person[] = [];
        function collect(p: Person) {
            list.push(p);
            if (p.children) p.children.forEach(collect);
        }
        if (treeRoot) collect(treeRoot);
        return list;
    }, [treeRoot]);

    const filteredA = useMemo(() => {
        if (!searchA.trim()) return allPeople.slice(0, 10);
        const q = searchA.toLowerCase();
        return allPeople.filter(p => p.name.toLowerCase().includes(q) || (p.translations?.EN?.name || '').toLowerCase().includes(q)).slice(0, 10);
    }, [allPeople, searchA]);

    const filteredB = useMemo(() => {
        if (!searchB.trim()) return allPeople.slice(0, 10);
        const q = searchB.toLowerCase();
        return allPeople.filter(p => p.name.toLowerCase().includes(q) || (p.translations?.EN?.name || '').toLowerCase().includes(q)).slice(0, 10);
    }, [allPeople, searchB]);

    const kinship: KinshipResult | null = useMemo(() => {
        if (!selectedA || !selectedB) return null;
        return calculateKinship(treeRoot, selectedA.id, selectedB.id);
    }, [treeRoot, selectedA, selectedB]);

    if (!isOpen) return null;

    const handleApplyHighlight = () => {
        if (kinship) {
            onHighlightLineage(kinship.path);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={clsx(
                "relative w-full max-w-xl rounded-3xl p-6 shadow-2xl border overflow-hidden flex flex-col max-h-[90vh]",
                theme === 'rajashahi'
                    ? "bg-[#fffdf8] border-[#ffd700] text-gray-900"
                    : "bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 text-gray-900 dark:text-gray-100"
            )}>
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                            <GitFork size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black tracking-tight">
                                {language === 'HI' ? 'रिश्ता कैलकुलेटर' : language === 'GU' ? 'સંબંધ કેલ્ક્યુલેટર' : 'Kinship / Relationship Calculator'}
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {language === 'HI' ? 'किन्हीं भी दो सदस्यों का आपस में संबंध जानें' : 'Discover the exact relation between any two family members'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        title="Close"
                        className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 py-4 flex flex-col gap-4">
                    {/* Selector Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Person A Selector */}
                        <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/60 flex flex-col gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                {language === 'HI' ? 'पहला सदस्य (Person A)' : 'Person A'}
                            </span>
                            {selectedA ? (
                                <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-700">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-xs shrink-0">
                                            {selectedA.name.slice(0, 2)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm truncate">{selectedA.name}</p>
                                            <p className="text-[10px] text-gray-400">Gen {selectedA.generation}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsSelectingA(true)}
                                        className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline ml-2"
                                    >
                                        Change
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsSelectingA(true)}
                                    className="p-3 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-all flex items-center justify-center gap-1.5"
                                >
                                    <User size={14} /> Select Member A
                                </button>
                            )}

                            {isSelectingA && (
                                <div className="mt-2 flex flex-col gap-1.5">
                                    <div className="relative">
                                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            autoFocus
                                            value={searchA}
                                            onChange={(e) => setSearchA(e.target.value)}
                                            placeholder="Search name..."
                                            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="max-h-36 overflow-y-auto flex flex-col gap-1 border border-gray-100 dark:border-slate-800 rounded-lg p-1 bg-white dark:bg-slate-900">
                                        {filteredA.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => {
                                                    setSelectedA(p);
                                                    setIsSelectingA(false);
                                                }}
                                                className="px-2 py-1.5 text-left text-xs rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 flex justify-between items-center"
                                            >
                                                <span className="font-semibold">{p.name}</span>
                                                <span className="text-[10px] text-gray-400">Gen {p.generation}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Person B Selector */}
                        <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/60 flex flex-col gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-pink-600 dark:text-pink-400">
                                {language === 'HI' ? 'दूसरा सदस्य (Person B)' : 'Person B'}
                            </span>
                            {selectedB ? (
                                <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-700">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-8 h-8 rounded-full bg-pink-500 text-white font-bold flex items-center justify-center text-xs shrink-0">
                                            {selectedB.name.slice(0, 2)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm truncate">{selectedB.name}</p>
                                            <p className="text-[10px] text-gray-400">Gen {selectedB.generation}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsSelectingB(true)}
                                        className="text-xs text-pink-600 dark:text-pink-400 font-bold hover:underline ml-2"
                                    >
                                        Change
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsSelectingB(true)}
                                    className="p-3 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-500 hover:border-pink-500 hover:text-pink-500 transition-all flex items-center justify-center gap-1.5"
                                >
                                    <User size={14} /> Select Member B
                                </button>
                            )}

                            {isSelectingB && (
                                <div className="mt-2 flex flex-col gap-1.5">
                                    <div className="relative">
                                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            autoFocus
                                            value={searchB}
                                            onChange={(e) => setSearchB(e.target.value)}
                                            placeholder="Search name..."
                                            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-pink-500"
                                        />
                                    </div>
                                    <div className="max-h-36 overflow-y-auto flex flex-col gap-1 border border-gray-100 dark:border-slate-800 rounded-lg p-1 bg-white dark:bg-slate-900">
                                        {filteredB.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => {
                                                    setSelectedB(p);
                                                    setIsSelectingB(false);
                                                }}
                                                className="px-2 py-1.5 text-left text-xs rounded hover:bg-pink-50 dark:hover:bg-pink-900/30 flex justify-between items-center"
                                            >
                                                <span className="font-semibold">{p.name}</span>
                                                <span className="text-[10px] text-gray-400">Gen {p.generation}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Calculated Relationship Result Card */}
                    {kinship ? (
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-indigo-950/40 border border-blue-200 dark:border-indigo-900/60 flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <Sparkles size={18} className="text-amber-500" />
                                <span className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-300">
                                    {language === 'HI' ? 'संबंध विश्लेषण' : 'Relationship Result'}
                                </span>
                            </div>

                            <div className="text-center py-2">
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                                    {language === 'HI' ? kinship.relationHI : language === 'GU' ? kinship.relationGU : kinship.relationEN}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                    {language === 'HI' ? kinship.descriptionHI : language === 'GU' ? kinship.descriptionGU : kinship.descriptionEN}
                                </p>
                            </div>

                            {/* Ancestor Pivot */}
                            <div className="flex items-center justify-between text-xs bg-white/70 dark:bg-slate-800/80 p-2.5 rounded-xl border border-gray-100 dark:border-slate-700">
                                <span className="text-gray-500">
                                    {language === 'HI' ? 'उभयनिष्ठ पूर्वज (LCA):' : 'Common Ancestor:'}
                                </span>
                                <span className="font-black text-indigo-600 dark:text-indigo-400">
                                    {kinship.lca.name} (Gen {kinship.lca.generation})
                                </span>
                            </div>

                            {/* Connecting Path length */}
                            <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                                <span>{language === 'HI' ? 'पीढ़ियों का अंतर:' : 'Generation Difference:'}</span>
                                <span className="font-bold">
                                    {kinship.generationDiff === 0
                                        ? (language === 'HI' ? 'समान पीढ़ी' : 'Same generation')
                                        : `${Math.abs(kinship.generationDiff)} ${language === 'HI' ? 'पीढ़ी' : 'generations'}`}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6 text-gray-400 text-xs">
                            {language === 'HI' ? 'ऊपर दोनों सदस्यों को चुनें ताकि उनका रिश्ता देखा जा सके।' : 'Select both members above to calculate and view their genealogical relation.'}
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        Close
                    </button>
                    {kinship && (
                        <button
                            onClick={handleApplyHighlight}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 dark:shadow-none transition-all flex items-center gap-1.5"
                        >
                            <CheckCircle2 size={14} />
                            {language === 'HI' ? 'ट्री पर पथ हाइलाइट करें' : 'Highlight Path on Tree'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
