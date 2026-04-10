import type { Person } from '../types';
import { Calendar, Briefcase, Heart, User, Phone, MapPin, BookOpen, X } from 'lucide-react';
import { translations, type Language, getTranslatedContent } from '../i18n';
import clsx from 'clsx';

interface ViewPersonModalProps {
    person: Person;
    language: Language;
    theme: 'light' | 'dark' | 'rajashahi';
    fontScale: 'sm' | 'md' | 'lg';
    isPrivacyMode?: boolean;
    onClose: () => void;
}

const DetailRow = ({ icon: Icon, label, value }: { icon: any, label: string, value?: string }) => {
    if (!value) return null;
    return (
        <div className="flex items-center gap-2 mb-1">
            <Icon size={14} className="text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">{label}:</span>
            <span className="text-sm text-gray-800 dark:text-gray-100">{value}</span>
        </div>
    );
};

const ViewPersonModal = ({ person, language, theme, fontScale, isPrivacyMode, onClose }: ViewPersonModalProps) => {
    const t = translations[language];

    // Translation helper for content
    const translateContent = (text?: string, field?: 'name'|'occupation'|'relation'|'spouse'|'bio'|'spouseOccupation') => {
        if (field && person.translations?.[language]?.[field]) {
            return person.translations[language][field];
        }
        return getTranslatedContent(text, language);
    };

    const maskPhone = (phone?: string) => {
        if (!phone) return undefined;
        if (!isPrivacyMode) return phone;
        return phone.length > 4 ? `******${phone.slice(-4)}` : '***';
    };

    const maskDate = (date?: string) => {
        if (!date) return undefined;
        if (!isPrivacyMode) return date;
        const parts = date.split('-');
        if (parts.length > 0 && parts[0].length === 4) return `**-**-${parts[0]}`;
        return `**-**-****`;
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 pb-20 sm:pb-6 pointer-events-auto">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={clsx(
                "relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 custom-scrollbar",
                theme === 'rajashahi' ? "bg-[#fff9f0] border-2 border-[#ffd700]/30" : "bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800",
                `font-scale-${fontScale}`
            )}>
                {/* Header */}
                <div className="sticky top-0 z-10 bg-gray-50/90 dark:bg-slate-800/90 backdrop-blur-md px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-700 dark:text-gray-200">{t.familyDetails}</h3>
                    <div className="flex items-center gap-3">
                        {person.anniversaryDate && (
                            <div className="flex items-center gap-1.5 text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/30 px-3 py-1 rounded-full border border-pink-100 dark:border-pink-800">
                                <Heart size={14} fill="currentColor" />
                                <span className="text-sm font-semibold">{person.anniversaryDate}</span>
                            </div>
                        )}
                        <button 
                            onClick={onClose}
                            title="Close"
                            aria-label="Close"
                            className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-6 flex flex-col gap-6">
                    {/* Primary Person */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                        <div className={clsx(
                            "w-28 h-28 sm:w-24 sm:h-24 rounded-3xl overflow-hidden border-4 shadow-md shrink-0",
                            theme === 'rajashahi' ? "border-[#ffd700]" : "border-white dark:border-slate-800"
                        )}>
                            {person.photoUrl ? (
                                <img src={person.photoUrl} alt={person.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className={clsx(
                                    "w-full h-full flex items-center justify-center",
                                    theme === 'rajashahi' ? "bg-orange-50" : "bg-gray-100 dark:bg-slate-800"
                                )}>
                                    <User size={40} className={clsx(
                                        theme === 'rajashahi' ? "text-amber-600" : "text-gray-400 dark:text-gray-500"
                                    )} />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className={clsx(
                                "font-black truncate leading-tight mb-2",
                                theme === 'rajashahi' ? "text-[#800000]" : "text-gray-800 dark:text-gray-100",
                                fontScale === 'sm' ? 'text-xl' : fontScale === 'md' ? 'text-2xl' : 'text-3xl'
                            )}>
                                {translateContent(person.name, 'name')}
                            </h3>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-4">
                                <span className={clsx(
                                    "text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-widest",
                                    theme === 'rajashahi' ? "bg-amber-100 text-amber-800" : "bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                                )}>
                                    {t.generations} {person.generation}
                                </span>
                                {person.relation && (
                                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight px-2 py-0.5 border border-gray-200 dark:border-gray-700 rounded-full">
                                        {translateContent(person.relation, 'relation')}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-1.5 flex flex-col items-center sm:items-start text-left w-full max-w-sm mx-auto sm:mx-0 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-800/50">
                                <DetailRow icon={Calendar} label={t.birth} value={maskDate(person.dateOfBirth)} />
                                <DetailRow icon={Calendar} label={t.death} value={person.dateOfDeath} />
                                <DetailRow icon={Briefcase} label={t.occupation} value={translateContent(person.occupation, 'occupation')} />
                                <DetailRow icon={Phone} label={t.phone} value={maskPhone(person.phoneNumber)} />
                            </div>
                            
                            {person.location?.name && !isPrivacyMode && (
                                <div className="flex items-center justify-center sm:justify-start gap-2 mt-3 group/loc w-full">
                                    <MapPin size={16} className="text-blue-500 shrink-0" />
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(person.location.name)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 dark:text-blue-400 font-bold hover:underline line-clamp-2"
                                    >
                                        {person.location.name}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Biography Section */}
                    {person.bio && (
                        <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 mb-3">
                                <BookOpen size={16} className="text-green-500" />
                                <span className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t.lifeStory}</span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic border-l-4 border-green-500/30 pl-4 bg-green-50/30 dark:bg-green-900/10 py-2 pr-2 rounded-r-xl">
                                "{translateContent(person.bio, 'bio')}"
                            </p>
                        </div>
                    )}

                    {/* Gallery Section */}
                    {person.gallery && person.gallery.length > 0 && (
                        <div className="pt-4 border-t border-gray-100 dark:border-slate-800 space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t.gallery}</h4>
                                <span className="text-xs text-gray-500 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-bold">{person.gallery.length} Photos</span>
                            </div>
                            <div className="flex gap-3 overflow-x-auto pb-3 custom-scrollbar snap-x">
                                {person.gallery.map((url, idx) => (
                                    <div key={idx} className="relative w-40 h-40 rounded-2xl overflow-hidden shrink-0 shadow-sm border border-gray-100 dark:border-slate-800 snap-center group">
                                        <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Spouse Details */}
                    {person.spouse && (
                        <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                            <div className="flex items-center justify-center sm:justify-start gap-2 mb-4">
                                <Heart size={16} className="text-pink-500 fill-current" />
                                <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                    {person.gender === 'MALE' ? t.wife : t.husband}
                                </span>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 bg-pink-50/50 dark:bg-pink-950/20 p-5 rounded-2xl border border-pink-100 dark:border-pink-900/40 text-center sm:text-left">
                                {/* Spouse Avatar */}
                                <div className="w-20 h-20 rounded-full bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center shrink-0 overflow-hidden border-4 border-white dark:border-slate-800 shadow-md">
                                    {person.spousePhotoUrl ? (
                                        <img src={person.spousePhotoUrl} alt={person.spouse} className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={28} className="text-pink-400 dark:text-pink-600 shadow-sm" />
                                    )}
                                </div>

                                <div className="flex-1 w-full">
                                    <div className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-3">{translateContent(person.spouse, 'spouse')}</div>
                                    <div className="space-y-1.5 flex flex-col items-center sm:items-start text-left mx-auto sm:mx-0 max-w-sm">
                                        <DetailRow icon={Calendar} label={t.birth} value={maskDate(person.spouseDateOfBirth)} />
                                        <DetailRow icon={Calendar} label={t.death} value={person.spouseDateOfDeath} />
                                        <DetailRow icon={Briefcase} label={t.occupation} value={translateContent(person.spouseOccupation, 'spouseOccupation')} />
                                        <DetailRow icon={Phone} label={t.phone} value={maskPhone(person.spousePhoneNumber)} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ViewPersonModal;
