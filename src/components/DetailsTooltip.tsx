import type { Person } from '../types';
import { Calendar, Briefcase, Heart, User, Phone, MapPin, BookOpen } from 'lucide-react';
import { translations, type Language, getTranslatedContent } from '../i18n';
import clsx from 'clsx';

interface DetailsTooltipProps {
    person: Person;
    language: Language;
    theme: 'light' | 'dark' | 'rajashahi';
    fontScale: 'sm' | 'md' | 'lg';
}

const DetailRow = ({ icon: Icon, label, value }: { icon: any, label: string, value?: string }) => {
    if (!value) return null;
    return (
        <div className="flex items-center gap-2 mb-1">
            <Icon size={14} className="text-gray-500 dark:text-gray-400" />
            <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">{label}:</span>
            <span className="text-xs text-gray-800 dark:text-gray-100">{value}</span>
        </div>
    );
};

const DetailsTooltip = ({ person, language, theme, fontScale }: DetailsTooltipProps) => {
    const t = translations[language];

    // Translation helper for content
    const translateContent = (text?: string) => getTranslatedContent(text, language);

    return (
        <div className={clsx(
            "absolute top-full left-1/2 -translate-x-1/2 mt-4 w-80 backdrop-blur-md rounded-2xl shadow-2xl p-5 z-[100] animate-in fade-in zoom-in-95 duration-200 pointer-events-auto",
            theme === 'rajashahi' ? "bg-[#fff9f0]/95 border-[#ffd700]/30" : "bg-white/95 dark:bg-slate-900/95 border-gray-100 dark:border-slate-800",
            `font-scale-${fontScale}`
        )}>
            <div className="bg-gray-50 dark:bg-slate-800 p-3 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
                <h3 className="font-bold text-gray-700 dark:text-gray-200">{t.familyDetails}</h3>
                {person.anniversaryDate && (
                    <div className="flex items-center gap-1 text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/30 px-2 py-1 rounded-full border border-pink-100 dark:border-pink-800">
                        <Heart size={12} fill="currentColor" />
                        <span className="text-xs font-semibold">{person.anniversaryDate}</span>
                    </div>
                )}
            </div>

            <div className="p-4 flex flex-col gap-4">
                {/* Primary Person */}
                <div className="flex items-start gap-4">
                    <div className={clsx(
                        "w-20 h-20 rounded-2xl overflow-hidden border-2 shadow-md",
                        theme === 'rajashahi' ? "border-[#ffd700]" : "border-white dark:border-slate-800"
                    )}>
                        {person.photoUrl ? (
                            <img src={person.photoUrl} alt={person.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className={clsx(
                                "w-full h-full flex items-center justify-center",
                                theme === 'rajashahi' ? "bg-orange-50" : "bg-gray-100 dark:bg-slate-800"
                            )}>
                                <User size={32} className={clsx(
                                    theme === 'rajashahi' ? "text-amber-600" : "text-gray-400 dark:text-gray-500"
                                )} />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className={clsx(
                            "font-black truncate leading-tight mb-1",
                            theme === 'rajashahi' ? "text-[#800000]" : "text-gray-800 dark:text-gray-100",
                            fontScale === 'sm' ? 'text-lg' : fontScale === 'md' ? 'text-xl' : 'text-2xl'
                        )}>
                            {translateContent(person.name)}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={clsx(
                                "text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
                                theme === 'rajashahi' ? "bg-amber-100 text-amber-800" : "bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                            )}>
                                {t.generations} {person.generation}
                            </span>
                            {person.relation && (
                                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight">{translateContent(person.relation)}</span>
                            )}
                        </div>

                        <div className="space-y-1">
                            <DetailRow icon={Calendar} label={t.birth} value={person.dateOfBirth} />
                            <DetailRow icon={Calendar} label={t.death} value={person.dateOfDeath} />
                            <DetailRow icon={Briefcase} label={t.occupation} value={translateContent(person.occupation)} />
                            <DetailRow icon={Phone} label={t.phone} value={person.phoneNumber} />
                            {person.location?.name && (
                                <div className="flex items-center gap-2 mt-2 group/loc">
                                    <MapPin size={14} className="text-blue-500" />
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(person.location.name)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                                    >
                                        {person.location.name}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Gallery Section */}
                {person.gallery && person.gallery.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t.gallery}</h4>
                            <div className="flex gap-1">
                                <span className="text-[10px] text-gray-400 font-bold">{person.gallery.length} Photos</span>
                            </div>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar snap-x">
                            {person.gallery.map((url, idx) => (
                                <div key={idx} className="relative w-32 h-32 rounded-lg overflow-hidden shrink-0 shadow-sm border border-gray-100 dark:border-slate-800 snap-center">
                                    <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover transition-transform hover:scale-110 duration-500" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Biography Section */}
                {person.bio && (
                    <div className="pt-3 border-t border-gray-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-2">
                            <BookOpen size={14} className="text-green-500" />
                            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t.lifeStory}</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed italic animate-in fade-in slide-in-from-top-1 duration-500">
                            "{person.bio}"
                        </p>
                    </div>
                )}

                {/* Spouse Details */}
                {person.spouse && (
                    <div className="pt-3 border-t border-gray-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-3">
                            <Heart size={14} className="text-pink-500 fill-current" />
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                {person.gender === 'MALE' ? t.wife : t.husband}
                            </span>
                        </div>

                        <div className="flex items-start gap-3 bg-pink-50/30 dark:bg-pink-950/20 p-3 rounded-xl border border-pink-100 dark:border-pink-900/40">
                            {/* Spouse Avatar */}
                            <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center shrink-0 overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm">
                                {person.spousePhotoUrl ? (
                                    <img src={person.spousePhotoUrl} alt={person.spouse} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={18} className="text-pink-400 dark:text-pink-600 shadow-sm" />
                                )}
                            </div>

                            <div className="flex-1">
                                <div className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-1">{translateContent(person.spouse)}</div>
                                <div className="space-y-1">
                                    <DetailRow icon={Calendar} label={t.birth} value={person.spouseDateOfBirth} />
                                    <DetailRow icon={Calendar} label={t.death} value={person.spouseDateOfDeath} />
                                    <DetailRow icon={Briefcase} label={t.occupation} value={translateContent(person.spouseOccupation)} />
                                    <DetailRow icon={Phone} label={t.phone} value={person.spousePhoneNumber} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DetailsTooltip;
