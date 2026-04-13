import React from 'react';
import { X, Search as SearchIcon, Calendar, Download, Printer, Users, Palette, RotateCcw, Sun, Moon, LogOut } from 'lucide-react';
import clsx from 'clsx';
import FileUpload from './FileUpload';
import type { Person } from '../types/person';
import type { Language } from '../i18n';
import type { Theme } from '../types/ui';
import type { UserData } from '../types/auth';

interface NavigationDrawersProps {
    isLeftDrawerOpen: boolean;
    isRightDrawerOpen: boolean;
    setIsLeftDrawerOpen: (value: boolean) => void;
    setIsRightDrawerOpen: (value: boolean) => void;
    user: UserData;
    t: Record<string, string>;
    language: Language;
    setLanguage: (value: Language) => void;
    theme: Theme;
    setTheme: (value: Theme) => void;
    setIsSearchOpen: (value: boolean) => void;
    setIsTimelineOpen: (value: boolean) => void;
    setIsCommunityOpen: (value: boolean) => void;
    setIsEditingHeader: (value: boolean) => void;
    handleDataLoaded: (data: Person) => void;
    handleExport: () => void;
    handleExportImage: () => void;
    handleExportPDF: () => void;
    handlePrint: () => void;
    handleReset: () => void;
    onLogout: () => void;
}

const NavigationDrawers: React.FC<NavigationDrawersProps> = ({
    isLeftDrawerOpen,
    isRightDrawerOpen,
    setIsLeftDrawerOpen,
    setIsRightDrawerOpen,
    user,
    t,
    language,
    setLanguage,
    theme,
    setTheme,
    setIsSearchOpen,
    setIsTimelineOpen,
    setIsCommunityOpen,
    setIsEditingHeader,
    handleDataLoaded,
    handleExport,
    handleExportImage,
    handleExportPDF,
    handlePrint,
    handleReset,
    onLogout
}) => {
    return (
        <>
            {/* Mobile Left Drawer */}
            {isLeftDrawerOpen && (
                <div className="fixed inset-0 z-[100] sm:hidden">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsLeftDrawerOpen(false)} />
                    <div className="absolute top-0 left-0 h-full w-64 bg-white dark:bg-slate-900 shadow-2xl p-4 animate-in slide-in-from-left duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-xs uppercase tracking-widest text-gray-400">Actions</h3>
                            <button onClick={() => setIsLeftDrawerOpen(false)} title="Close Menu" aria-label="Close Menu"><X size={20} className="text-gray-500" /></button>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button onClick={() => { setIsSearchOpen(true); setIsLeftDrawerOpen(false); }} className="w-full flex items-center gap-3 bg-blue-600 p-3 rounded-xl text-white font-bold"><SearchIcon size={20} />{t.findPerson}</button>
                            <button onClick={() => { setIsTimelineOpen(true); setIsLeftDrawerOpen(false); }} className="w-full flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-200 dark:border-slate-700 text-orange-600 dark:text-orange-400 font-bold"><Calendar size={20} />{t.timeline}</button>
                            {user.role === 'ADMIN' && (
                                <>
                                    <FileUpload onDataLoaded={handleDataLoaded} />
                                    <button onClick={() => { handleExport(); setIsLeftDrawerOpen(false); }} className="w-full flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 font-bold"><Download size={20} />{t.export} (JSON)</button>
                                    <button onClick={() => { handleExportImage(); setIsLeftDrawerOpen(false); }} className="w-full flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 font-bold"><Download size={20} />Export Image</button>
                                    <button onClick={() => { handleExportPDF(); setIsLeftDrawerOpen(false); }} className="w-full flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-200 dark:border-slate-700 text-red-600 font-bold"><Download size={20} />Export PDF</button>
                                    <button onClick={() => { handlePrint(); setIsLeftDrawerOpen(false); }} className="w-full flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 font-bold"><Printer size={20} />Print Tree</button>
                                    <button onClick={() => { setIsCommunityOpen(true); setIsLeftDrawerOpen(false); }} className="w-full flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-700 p-3 rounded-xl text-white font-bold"><Users size={20} />{t.community}</button>
                                    <button onClick={() => { setIsEditingHeader(true); setIsLeftDrawerOpen(false); }} className="w-full flex items-center gap-3 bg-purple-600 p-3 rounded-xl text-white font-bold"><Palette size={20} />Header Editor</button>
                                    <button onClick={() => { handleReset(); setIsLeftDrawerOpen(false); }} className="w-full flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-200 dark:border-slate-700 text-red-600 font-bold"><RotateCcw size={20} />{t.reset}</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Right Drawer */}
            {isRightDrawerOpen && (
                <div className="fixed inset-0 z-[100] sm:hidden">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsRightDrawerOpen(false)} />
                    <div className="absolute top-0 right-0 h-full w-64 bg-white dark:bg-slate-900 shadow-2xl p-4 animate-in slide-in-from-right duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <button onClick={() => setIsRightDrawerOpen(false)} title="Close Settings" aria-label="Close Settings"><X size={20} className="text-gray-500" /></button>
                            <h3 className="font-black text-xs uppercase tracking-widest text-gray-400">Settings</h3>
                        </div>
                        <div className="flex flex-col gap-6">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Theme</label>
                                <div className="grid grid-cols-1 gap-2">
                                    <button onClick={() => setTheme('light')} className={clsx("p-3 rounded-xl flex items-center gap-3 font-bold", theme === 'light' ? "bg-blue-600 text-white" : "bg-gray-50 dark:bg-slate-800 text-gray-500")}><Sun size={18} />Light</button>
                                    <button onClick={() => setTheme('dark')} className={clsx("p-3 rounded-xl flex items-center gap-3 font-bold", theme === 'dark' ? "bg-blue-600 text-white" : "bg-gray-50 dark:bg-slate-800 text-gray-400")}><Moon size={18} />Dark</button>
                                    <button onClick={() => setTheme('rajashahi')} className={clsx("p-3 rounded-xl flex items-center gap-3 font-bold", theme === 'rajashahi' ? "bg-orange-600 text-white" : "bg-orange-50/50 dark:bg-orange-900/10 text-orange-600")}><Palette size={18} />Royal</button>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Language</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['EN', 'HI', 'GU'] as const).map(lang => (
                                        <button key={lang} onClick={() => setLanguage(lang)} className={clsx("py-2 rounded-lg text-xs font-black", language === lang ? "bg-blue-600 text-white" : "bg-gray-50 dark:bg-slate-800 text-gray-500")}>{lang}</button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                                <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 text-red-600 font-black"><LogOut size={20} />Logout</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default NavigationDrawers;
