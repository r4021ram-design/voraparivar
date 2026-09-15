import { Calendar, Briefcase, Heart, Phone, MapPin, BookOpen, X, GitFork, ChevronRight, User } from 'lucide-react';
import type { Person } from '../types/person';
import { translations, type Language, getTranslatedContent } from '../i18n';
import clsx from 'clsx';

interface ViewPersonModalProps {
    person: Person;
    language: Language;
    theme: 'light' | 'dark' | 'rajashahi';
    fontScale: 'sm' | 'md' | 'lg';
    isPrivacyMode?: boolean;
    onClose: () => void;
    onFocusPerson?: (personId: string) => void;
    onOpenKinshipWith?: (person: Person) => void;
}

const DetailRow = ({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number; className?: string }>, label: string, value?: string }) => {
    if (!value) return null;
    return (
        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-800/80 text-xs">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Icon size={14} className="shrink-0 text-blue-500" />
                <span className="font-medium">{label}:</span>
            </div>
            <span className="font-bold text-gray-800 dark:text-gray-200 text-right">{value}</span>
        </div>
    );
};

export default function ViewPersonModal({
    person,
    language,
    theme,
    fontScale,
    isPrivacyMode,
    onClose,
    onFocusPerson,
    onOpenKinshipWith,
}: ViewPersonModalProps) {
    const t = translations[language];

    // Translation helper for content
    const translateContent = (text?: string, field?: 'name' | 'occupation' | 'relation' | 'spouse' | 'bio' | 'spouseOccupation') => {
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

    const calculateAge = (dob?: string, dod?: string) => {
        if (!dob) return undefined;
        const birthDate = new Date(dob);
        const endDate = dod ? new Date(dod) : new Date();
        let age = endDate.getFullYear() - birthDate.getFullYear();
        const m = endDate.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && endDate.getDate() < birthDate.getDate())) {
            age--;
        }
        return age > 0 ? `${age} ${language === 'HI' ? 'वर्ष' : language === 'GU' ? 'વર્ષ' : 'years'}` : undefined;
    };

    const isFemale = person.gender === 'FEMALE';
    const ageDisplay = calculateAge(person.dateOfBirth, person.dateOfDeath);

    return (
        <div className="fixed inset-0 z-[200] flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={onClose} />

            {/* Sliding Profile Drawer */}
            <div className={clsx(
                "relative z-10 w-full sm:w-[450px] h-full shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300 border-l",
                theme === 'rajashahi'
                    ? "bg-[#fffdf8] border-[#ffd700]/50 text-gray-900"
                    : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100"
            )}>
                {/* Header with Photo / Monogram & Cover */}
                <div className={clsx(
                    "relative p-6 pt-10 pb-6 flex flex-col items-center text-center transition-colors",
                    theme === 'rajashahi'
                        ? "bg-gradient-to-b from-[#800000] to-[#5c0000] text-white"
                        : isFemale
                        ? "bg-gradient-to-b from-rose-500 to-pink-700 text-white"
                        : "bg-gradient-to-b from-blue-600 to-indigo-800 text-white"
                )}>
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
                        title="Close"
                    >
                        <X size={18} />
                    </button>

                    {/* Avatar */}
                    <div className="relative mb-3">
                        {person.photoUrl ? (
                            <img
                                src={person.photoUrl}
                                alt={person.name}
                                className="w-24 h-24 rounded-full object-cover ring-4 ring-white/60 shadow-xl"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-2xl ring-4 ring-white/40 shadow-xl">
                                {person.name.trim().slice(0, 2).toUpperCase()}
                            </div>
                        )}
                        {/* Memorial Badge */}
                        {person.dateOfDeath && (
                            <span className="absolute bottom-0 right-0 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full border border-white/40 shadow">
                                🕊️ {language === 'HI' ? 'स्व.' : 'Late'}
                            </span>
                        )}
                    </div>

                    {/* Name */}
                    <h2 className={clsx(
                        "font-black tracking-tight drop-shadow-sm",
                        fontScale === 'sm' ? 'text-xl' : fontScale === 'md' ? 'text-2xl' : 'text-3xl'
                    )}>
                        {translateContent(person.name, 'name')}
                    </h2>

                    {/* Relation & Generation Pill */}
                    <div className="flex items-center gap-2 mt-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                            {t.generations} {person.generation}
                        </span>
                        {person.relation && (
                            <span className="px-2.5 py-0.5 rounded-full bg-black/20 text-xs font-medium backdrop-blur-sm">
                                {translateContent(person.relation, 'relation')}
                            </span>
                        )}
                    </div>

                    {/* Kinship button directly on profile */}
                    {onOpenKinshipWith && (
                        <button
                            onClick={() => onOpenKinshipWith(person)}
                            className="mt-4 px-4 py-2 rounded-full bg-white text-gray-900 hover:bg-white/90 text-xs font-black shadow-lg transition-transform active:scale-95 flex items-center gap-2"
                        >
                            <GitFork size={14} className="text-blue-600" />
                            <span>{language === 'HI' ? 'रिश्ता कैलकुलेट करें' : language === 'GU' ? 'સંબંધ ગણતરી' : 'Calculate Relationship'}</span>
                        </button>
                    )}
                </div>

                {/* Profile Details Content */}
                <div className="p-5 flex flex-col gap-4 flex-1">
                    {/* Bio Section */}
                    {person.bio && (
                        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
                            <h3 className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1.5">
                                <BookOpen size={14} />
                                {language === 'HI' ? 'जीवन परिचय' : language === 'GU' ? 'જીવનચરિત્ર' : 'Biography'}
                            </h3>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
                                "{translateContent(person.bio, 'bio')}"
                            </p>
                        </div>
                    )}

                    {/* Personal Details Table */}
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
                        <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                            {language === 'HI' ? 'व्यक्तिगत विवरण' : language === 'GU' ? 'વ્યક્તિગત વિગતો' : 'Personal Details'}
                        </h3>
                        <div className="flex flex-col">
                            <DetailRow icon={Briefcase} label={t.occupation} value={translateContent(person.occupation, 'occupation')} />
                            <DetailRow icon={Calendar} label={t.birthDate} value={maskDate(person.dateOfBirth)} />
                            {person.dateOfDeath && (
                                <DetailRow icon={Calendar} label={t.deathDate} value={maskDate(person.dateOfDeath)} />
                            )}
                            {ageDisplay && (
                                <DetailRow icon={User} label={person.dateOfDeath ? (language === 'HI' ? 'आयु (निधन समय)' : language === 'GU' ? 'ઉંમર (અવસાન સમયે)' : 'Age at passing') : (language === 'HI' ? 'वर्तमान आयु' : language === 'GU' ? 'વર્તમાન ઉંમર' : 'Current Age')} value={ageDisplay} />
                            )}
                            <DetailRow icon={Phone} label={t.phone} value={maskPhone(person.phoneNumber)} />
                            <DetailRow icon={MapPin} label={language === 'HI' ? 'स्थान' : language === 'GU' ? 'સ્થાન' : 'Location'} value={person.location?.name} />
                        </div>
                    </div>

                    {/* Spouse Details */}
                    {person.spouse && (
                        <div className="p-4 rounded-2xl bg-pink-50/50 dark:bg-rose-950/20 border border-pink-100 dark:border-rose-900/30">
                            <h3 className="text-xs font-black uppercase tracking-wider text-pink-600 dark:text-pink-400 mb-3 flex items-center gap-1.5">
                                <Heart size={14} />
                                {t.spouse || 'Spouse'}
                            </h3>

                            <div className="flex items-center gap-3 mb-3">
                                {person.spousePhotoUrl ? (
                                    <img src={person.spousePhotoUrl} alt="" className="w-12 h-12 rounded-full object-cover shadow-sm" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-pink-200 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 font-bold flex items-center justify-center text-sm">
                                        {translateContent(person.spouse, 'spouse').trim().slice(0, 2).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <h4 className="font-bold text-base text-gray-900 dark:text-gray-100">
                                        {translateContent(person.spouse, 'spouse')}
                                    </h4>
                                    {person.spouseOccupation && (
                                        <p className="text-xs text-gray-500 italic">
                                            {translateContent(person.spouseOccupation, 'spouseOccupation')}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col">
                                <DetailRow icon={Calendar} label={t.anniversary || 'Anniversary'} value={maskDate(person.anniversaryDate)} />
                                <DetailRow icon={Calendar} label={t.birthDate} value={maskDate(person.spouseDateOfBirth)} />
                                {person.spouseDateOfDeath && (
                                    <DetailRow icon={Calendar} label={t.deathDate} value={maskDate(person.spouseDateOfDeath)} />
                                )}
                                <DetailRow icon={Phone} label={t.phone} value={maskPhone(person.spousePhoneNumber)} />
                            </div>
                        </div>
                    )}

                    {/* Children List & Quick Jumps */}
                    {person.children && person.children.length > 0 && (
                        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
                            <h3 className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
                                {language === 'HI' ? `संतान (${person.children.length})` : language === 'GU' ? `સંતાન (${person.children.length})` : `Children (${person.children.length})`}
                            </h3>
                            <div className="flex flex-col gap-1.5 mt-2">
                                {person.children.map(child => {
                                    const childName = child.translations?.[language]?.name || getTranslatedContent(child.name, language);
                                    const childInitial = childName.trim().slice(0, 1).toUpperCase();
                                    const genLabel = language === 'GU' ? 'પેઢી' : language === 'HI' ? 'पीढ़ी' : 'Gen';
                                    return (
                                        <button
                                            key={child.id}
                                            onClick={() => {
                                                onFocusPerson?.(child.id);
                                                onClose();
                                            }}
                                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-gray-100 dark:border-slate-700/60 flex items-center justify-between text-left transition-colors"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className={clsx(
                                                    "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white",
                                                    child.gender === 'FEMALE' ? "bg-pink-500" : "bg-blue-500"
                                                )}>
                                                    {childInitial}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{childName}</p>
                                                    <p className="text-[10px] text-gray-400">{genLabel} {child.generation}</p>
                                                </div>
                                            </div>
                                            <ChevronRight size={14} className="text-gray-400" />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
