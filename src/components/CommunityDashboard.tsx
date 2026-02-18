import React, { useState } from 'react';
import { X, Calendar, MapPin, Users, Heart, ChevronRight, Share2, Plus } from 'lucide-react';
import { translations, type Language } from '../i18n';

interface FamilyEvent {
    id: string;
    title: string;
    date: string;
    location: string;
    type: 'REUNION' | 'ANNIVERSARY' | 'OTHER';
    rsvps: number;
}

interface CommunityDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    language?: Language;
}

const CommunityDashboard: React.FC<CommunityDashboardProps> = ({ isOpen, onClose, language = 'EN' }) => {
    const t = translations[language];
    const [events] = useState<FamilyEvent[]>([
        {
            id: '1',
            title: 'Annual Family Reunion 2026',
            date: '2026-05-15',
            location: 'Mundra, Gujarat',
            type: 'REUNION',
            rsvps: 24
        },
        {
            id: '2',
            title: 'Centenary Anniversary Celebration',
            date: '2026-08-10',
            location: 'Community Hall',
            type: 'ANNIVERSARY',
            rsvps: 12
        }
    ]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden h-[90vh] sm:h-auto sm:max-h-[85vh] flex flex-col border border-gray-100 dark:border-slate-800 animate-in slide-in-from-bottom-8 duration-500">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <Users size={24} className="text-blue-100" />
                        <div>
                            <h2 className="text-xl font-bold">{t.communityTitle}</h2>
                            <p className="text-blue-100 text-xs opacity-80 uppercase tracking-widest font-bold mt-1">{t.upcomingEvents}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-slate-50 dark:bg-slate-950/50">
                    {/* Events Section */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t.events}</h3>
                            <button className="text-[10px] bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full font-bold hover:bg-blue-100 transition-colors flex items-center gap-1">
                                <Plus size={12} /> Add Event
                            </button>
                        </div>

                        <div className="grid gap-4">
                            {events.map((event) => (
                                <div key={event.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 group hover:shadow-md hover:border-blue-100 dark:hover:border-blue-900 transition-all flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 ${event.type === 'REUNION' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600' :
                                        event.type === 'ANNIVERSARY' ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-600' :
                                            'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                                        }`}>
                                        <Calendar size={20} />
                                        <span className="text-[8px] font-black uppercase mt-1">May</span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-tight">{event.title}</h4>
                                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center gap-1.5">
                                                <MapPin size={14} className="text-gray-400" />
                                                {event.location}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Users size={14} className="text-gray-400" />
                                                {event.rsvps} {t.rsvp}
                                            </div>
                                        </div>
                                    </div>

                                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-95">
                                        {t.joinEvent}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Community Engagement */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/10 dark:to-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/40 space-y-3">
                            <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm">
                                <Share2 size={20} className="text-blue-600" />
                            </div>
                            <h4 className="font-bold text-sm text-gray-800 dark:text-gray-100">{t.shareTree}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Let other members explore our shared history and heritage.</p>
                            <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 hover:underline">
                                Generate Link <ChevronRight size={12} />
                            </button>
                        </div>

                        <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/10 dark:to-rose-900/10 p-5 rounded-2xl border border-pink-100 dark:border-pink-900/40 space-y-3">
                            <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm">
                                <Heart size={20} className="text-pink-600" />
                            </div>
                            <h4 className="font-bold text-sm text-gray-800 dark:text-gray-100">Help Preserve History</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Contribute missing details, photos, or correct records.</p>
                            <button className="text-[10px] font-black text-pink-600 uppercase tracking-widest flex items-center gap-1 hover:underline">
                                Learn More <ChevronRight size={12} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 text-center">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">© 2026 Community Portal. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default CommunityDashboard;
