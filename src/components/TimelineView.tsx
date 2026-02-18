import { useMemo } from 'react';
import { Calendar, Cake, Heart, Flame, X } from 'lucide-react';
import type { Node } from 'reactflow';
import type { Person } from '../types';
import { translations, type Language, getTranslatedContent } from '../i18n';

interface TimelineEvent {
    id: string;
    personId: string;
    name: string;
    type: 'BIRTH' | 'DEATH' | 'ANNIVERSARY';
    date: string; // YYYY-MM-DD or similar
    year: number;
    description: string;
}

interface TimelineViewProps {
    nodes: Node[];
    isOpen: boolean;
    onClose: () => void;
    onFocusNode: (nodeId: string) => void;
    language?: Language;
}

export default function TimelineView({ nodes, isOpen, onClose, onFocusNode, language = 'EN' }: TimelineViewProps) {
    const t = translations[language];

    const events = useMemo(() => {
        const extracted: TimelineEvent[] = [];

        nodes.forEach(node => {
            const p = node.data.person as Person;

            if (p.dateOfBirth) {
                const year = new Date(p.dateOfBirth).getFullYear();
                if (!isNaN(year)) {
                    extracted.push({
                        id: `${p.id}-birth`,
                        personId: p.id,
                        name: p.name,
                        type: 'BIRTH',
                        date: p.dateOfBirth,
                        year,
                        description: `${t.birth} - ${p.name}`
                    });
                }
            }

            if (p.dateOfDeath) {
                const year = new Date(p.dateOfDeath).getFullYear();
                if (!isNaN(year)) {
                    extracted.push({
                        id: `${p.id}-death`,
                        personId: p.id,
                        name: p.name,
                        type: 'DEATH',
                        date: p.dateOfDeath,
                        year,
                        description: `${t.death} - ${p.name}`
                    });
                }
            }

            if (p.anniversaryDate) {
                const year = new Date(p.anniversaryDate).getFullYear();
                if (!isNaN(year)) {
                    extracted.push({
                        id: `${p.id}-anniversary`,
                        personId: p.id,
                        name: p.name,
                        type: 'ANNIVERSARY',
                        date: p.anniversaryDate,
                        year,
                        description: `${t.anniversary} - ${p.name} & ${p.spouse || t.spouse}`
                    });
                }
            }
        });

        return extracted.sort((a, b) => b.year - a.year); // Latest first
    }, [nodes, t]);

    if (!isOpen) return null;

    return (
        <div className="absolute top-0 left-0 w-80 h-full bg-white/95 dark:bg-slate-900/95 rajashahi:bg-[#fff9f0]/95 backdrop-blur-md shadow-2xl z-[60] flex flex-col border-r border-gray-200 dark:border-slate-800 rajashahi:border-[#ffd700]/30 animate-in slide-in-from-left duration-300">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 rajashahi:text-[#800000] flex items-center gap-2">
                    <Calendar size={20} className="text-orange-600 dark:text-orange-400 rajashahi:text-[#800000]" />
                    {t.timeline}
                </h2>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-500 dark:text-gray-400"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Events List */}
            <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar space-y-8 relative">
                {/* Timeline Line */}
                <div className="absolute left-[2.25rem] top-8 bottom-8 w-0.5 bg-gray-100 dark:bg-slate-800 -z-10"></div>

                {events.length > 0 ? (
                    events.map((event) => (
                        <div key={event.id} className="relative flex items-start gap-4 group">
                            {/* Icon Circle */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border-4 border-white dark:border-slate-900 z-10 ${event.type === 'BIRTH' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                                event.type === 'DEATH' ? 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400' :
                                    'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400'
                                }: event.type === 'BIRTH' ? 'rajashahi:bg-orange-50 rajashahi:text-amber-600' : event.type === 'DEATH' ? 'rajashahi:bg-gray-100 rajashahi:text-gray-600' : 'rajashahi:bg-pink-50 rajashahi:text-pink-600'}`}>
                                {event.type === 'BIRTH' ? <Cake size={18} /> :
                                    event.type === 'DEATH' ? <Flame size={18} /> :
                                        <Heart size={18} />}
                            </div>

                            {/* Content */}
                            <div className="flex-1 pt-1">
                                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">
                                    {event.date}
                                </span>
                                <button
                                    onClick={() => onFocusNode(event.personId)}
                                    className="text-left w-full hover:bg-blue-50/50 dark:hover:bg-blue-900/10 rajashahi:hover:bg-amber-50/50 p-2 -ml-2 rounded-lg transition-all"
                                >
                                    <h3 className="font-bold text-gray-800 dark:text-gray-100 rajashahi:text-[#800000] text-sm">{event.year}</h3>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 rajashahi:text-amber-900 mt-0.5">{getTranslatedContent(event.description, language)}</p>
                                    <div className="flex items-center gap-2 mt-2 text-[10px] text-blue-600 dark:text-blue-400 font-medium group-hover:translate-x-1 transition-transform">
                                        {t.viewOnTree}
                                    </div>
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 space-y-4">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-gray-200 dark:text-gray-700">
                            <Calendar size={32} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-gray-500 dark:text-gray-400 font-medium">{t.noMilestones}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{t.milestoneDescription}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
