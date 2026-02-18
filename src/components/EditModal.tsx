import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { Person } from '../types';
import { translations, type Language } from '../i18n';

interface EditModalProps {
    person: Person | null;
    onClose: () => void;
    onSave: (updatedPerson: Person) => void;
    language?: Language;
}

const InputField = ({ label, value, onChange, type = "text" }: { label: string, value: string, onChange: (val: string) => void, type?: string }) => (
    <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            title={label}
            placeholder={label}
            className="p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-800 dark:text-gray-100 transition-all"
        />
    </div>
);

const TextAreaField = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => (
    <div className="flex flex-col gap-1 col-span-1 sm:col-span-2">
        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</label>
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            title={label}
            placeholder={label}
            className="p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-800 dark:text-gray-100 transition-all resize-none"
        />
    </div>
);

const EditModal = ({ person, onClose, onSave, language = 'EN' }: EditModalProps) => {
    const [formData, setFormData] = useState<Person | null>(null);
    const t = translations[language];

    useEffect(() => {
        if (person) {
            setFormData({ ...person });
        }
    }, [person]);

    if (!person || !formData) return null;

    const handleSave = () => {
        onSave(formData);
        onClose();
    };

    const handleChange = (field: keyof Person, value: any) => {
        setFormData(prev => prev ? ({ ...prev, [field]: value }) : null);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 h-[85vh] sm:h-auto max-h-[90vh] flex flex-col border border-gray-100 dark:border-slate-800">
                <div className="bg-gray-50 dark:bg-slate-800 p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                    <h2 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                        {t.editDetails}
                    </h2>
                    <button onClick={onClose} title="Close" aria-label="Close" className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-500 dark:text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
                    {/* Photo Upload Section */}
                    <div className="col-span-1 sm:col-span-2 flex items-center gap-4 mb-4 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
                        <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center overflow-hidden shrink-0 relative group hover:border-blue-400 transition-colors shadow-sm">
                            {formData.photoUrl ? (
                                <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 text-center p-1 font-bold uppercase tracking-tighter">{t.noPhoto}</span>
                            )}
                        </div>
                        <div className="flex-1">
                            <label htmlFor="photo-upload" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">{t.uploadPhoto}</label>
                            <input
                                id="photo-upload"
                                title="Upload Photo"
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        try {
                                            // Local Preview
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                handleChange('photoUrl', reader.result as string);
                                            };
                                            reader.readAsDataURL(file);

                                            // Upload to Supabase
                                            const { supabase } = await import('../lib/supabase');
                                            const fileExt = file.name.split('.').pop();
                                            const fileName = `${formData.id}/${Date.now()}.${fileExt}`;
                                            const { error: uploadError } = await supabase.storage
                                                .from('family-media')
                                                .upload(fileName, file);

                                            if (uploadError) throw uploadError;

                                            const { data: { publicUrl } } = supabase.storage
                                                .from('family-media')
                                                .getPublicUrl(fileName);

                                            handleChange('photoUrl', publicUrl);

                                            // Add to Media Table (Optional but good for gallery)
                                            await supabase.from('media').insert({
                                                person_id: formData.id,
                                                url: publicUrl,
                                                type: 'PROFILE'
                                            });

                                        } catch (error) {
                                            console.error('Error uploading image:', error);
                                            alert('Failed to upload image');
                                        }
                                    }
                                }}
                                className="block w-full text-xs text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-blue-50 dark:file:bg-blue-900/40 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/60 cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                        <InputField label={t.fullName} value={formData.name} onChange={(v) => handleChange('name', v)} />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t.gender}</label>
                        <select
                            value={formData.gender || 'MALE'}
                            onChange={(e) => handleChange('gender', e.target.value)}
                            className="p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm h-[38px] text-gray-800 dark:text-gray-100"
                            title={t.gender}
                            aria-label={t.gender}
                        >
                            <option value="MALE">{t.male}</option>
                            <option value="FEMALE">{t.female}</option>
                        </select>
                    </div>

                    <InputField label={t.relation} value={formData.relation || ''} onChange={(v) => handleChange('relation', v)} />

                    <div className="col-span-1">
                        <InputField label={t.occupation} value={formData.occupation || ''} onChange={(v) => handleChange('occupation', v)} />
                    </div>
                    <div className="col-span-1">
                        <InputField label={t.phone} value={formData.phoneNumber || ''} onChange={(v) => handleChange('phoneNumber', v)} />
                    </div>

                    <InputField label={t.birthDate} type="date" value={formData.dateOfBirth || ''} onChange={(v) => handleChange('dateOfBirth', v)} />
                    <InputField label={t.deathDate} type="date" value={formData.dateOfDeath || ''} onChange={(v) => handleChange('dateOfDeath', v)} />

                    {/* Phase 3: Bio & Location */}
                    <div className="col-span-1 sm:col-span-2 border-t border-gray-100 dark:border-slate-800 pt-6 mt-2">
                        <h3 className="text-sm font-black text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2 uppercase tracking-widest">
                            <span className="w-1 h-5 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.3)]"></span>
                            {t.lifeStory}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                            <InputField label={t.location} value={formData.location?.name || ''} onChange={(v) => handleChange('location', { ...formData.location, name: v })} />
                            <div className="hidden sm:block"></div>
                            <TextAreaField label={t.bio} value={formData.bio || ''} onChange={(v) => handleChange('bio', v)} />
                        </div>
                    </div>

                    {/* Phase 3: Gallery */}
                    <div className="col-span-1 sm:col-span-2 border-t border-gray-100 dark:border-slate-800 pt-6 mt-2">
                        <h3 className="text-sm font-black text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2 uppercase tracking-widest">
                            <span className="w-1 h-5 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.3)]"></span>
                            {t.gallery}
                        </h3>

                        <div className="flex flex-wrap gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800">
                            {formData.gallery?.map((url, idx) => (
                                <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden group shadow-sm">
                                    <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => {
                                            const newGallery = [...(formData.gallery || [])];
                                            newGallery.splice(idx, 1);
                                            handleChange('gallery', newGallery);
                                        }}
                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove Photo"
                                        aria-label="Remove Photo"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                            <label className="w-24 h-24 rounded-xl bg-white dark:bg-slate-800 border-2 border-dashed border-gray-300 dark:border-slate-600 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 text-gray-400 dark:text-gray-500 transition-colors">
                                <span className="text-xl font-bold">+</span>
                                <span className="text-[8px] uppercase font-black tracking-tighter">{t.addPhoto}</span>
                                <input
                                    id="gallery-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    title="Add Gallery Photo"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                const newGallery = [...(formData.gallery || []), reader.result as string];
                                                handleChange('gallery', newGallery);
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                            </label>
                        </div>
                    </div>

                    <div className="col-span-1 sm:col-span-2 border-t border-gray-100 dark:border-slate-800 pt-6 mt-2">
                        <h3 className="text-sm font-black text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2 uppercase tracking-widest">
                            <span className="w-1 h-5 bg-pink-500 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.5)]"></span>
                            {t.spousalDetails}
                        </h3>

                        <div className="flex items-start gap-4 mb-6 bg-pink-50/30 dark:bg-pink-900/10 p-4 rounded-2xl border border-pink-100 dark:border-pink-900/30">
                            {/* Spouse Photo Upload */}
                            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border-2 border-dashed border-pink-200 dark:border-pink-900 flex items-center justify-center overflow-hidden shrink-0 relative group hover:border-pink-400 transition-colors shadow-sm">
                                {formData.spousePhotoUrl ? (
                                    <img src={formData.spousePhotoUrl} alt="Spouse Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-[10px] text-pink-400 dark:text-pink-600 text-center font-bold uppercase tracking-tighter leading-tight">{t.noPhoto}</span>
                                )}
                                <input
                                    type="file"
                                    title="Upload Spouse Photo"
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            try {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    handleChange('spousePhotoUrl', reader.result as string);
                                                };
                                                reader.readAsDataURL(file);

                                                const { supabase } = await import('../lib/supabase');
                                                const fileExt = file.name.split('.').pop();
                                                const fileName = `${formData.id}/spouse_${Date.now()}.${fileExt}`;

                                                const { error: uploadError } = await supabase.storage
                                                    .from('family-media')
                                                    .upload(fileName, file);

                                                if (uploadError) throw uploadError;

                                                const { data: { publicUrl } } = supabase.storage
                                                    .from('family-media')
                                                    .getPublicUrl(fileName);

                                                handleChange('spousePhotoUrl', publicUrl);

                                                await supabase.from('media').insert({
                                                    person_id: formData.id,
                                                    url: publicUrl,
                                                    type: 'SPOUSE_PROFILE'
                                                });
                                            } catch (error) {
                                                console.error('Error uploading image:', error);
                                                alert('Failed to upload image');
                                            }
                                        }
                                    }}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </div>
                            <div className="flex-1">
                                <InputField label={t.spouseName} value={formData.spouse || ''} onChange={(v) => handleChange('spouse', v)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                            <InputField label={t.anniversary} type="date" value={formData.anniversaryDate || ''} onChange={(v) => handleChange('anniversaryDate', v)} />
                            <InputField label={t.spouseOccupation} value={formData.spouseOccupation || ''} onChange={(v) => handleChange('spouseOccupation', v)} />
                            <InputField label={t.spousePhone} value={formData.spousePhoneNumber || ''} onChange={(v) => handleChange('spousePhoneNumber', v)} />
                            <div className="col-span-1 hidden sm:block"></div>

                            <InputField label={t.spouseBirthDate} type="date" value={formData.spouseDateOfBirth || ''} onChange={(v) => handleChange('spouseDateOfBirth', v)} />
                            <InputField label={t.spouseDeathDate} type="date" value={formData.spouseDateOfDeath || ''} onChange={(v) => handleChange('spouseDateOfDeath', v)} />
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-slate-800/80 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl text-sm font-bold uppercase tracking-widest transition-all">{t.cancel}</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-sm font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                        <Save size={16} /> {t.saveChanges}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditModal;
