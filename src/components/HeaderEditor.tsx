import React from 'react';
import { Palette } from 'lucide-react';

interface HeaderEditorProps {
    isOpen: boolean;
    headerVerse: string;
    headerTitle: string;
    setHeaderVerse: (value: string) => void;
    setHeaderTitle: (value: string) => void;
    onClose: () => void;
    onSave: (e: React.FormEvent) => void;
}

const HeaderEditor: React.FC<HeaderEditorProps> = ({
    isOpen,
    headerVerse,
    headerTitle,
    setHeaderVerse,
    setHeaderTitle,
    onClose,
    onSave
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-all duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 animate-in fade-in zoom-in duration-300">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-6 py-5 flex justify-between items-center">
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                        <Palette size={24} />
                        Customize Header Text
                    </h2>
                </div>

                <form onSubmit={onSave} className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Sanskrit Verse / Subtitle</label>
                        <textarea
                            value={headerVerse}
                            onChange={(e) => setHeaderVerse(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all text-sm font-medium leading-relaxed dark:text-white"
                            placeholder="Enter the cultural verse..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Main Application Title</label>
                        <input
                            type="text"
                            value={headerTitle}
                            onChange={(e) => setHeaderTitle(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all text-lg font-black dark:text-white"
                            placeholder="Enter title..."
                        />
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-purple-600 hover:bg-purple-700 text-white font-black px-8 py-2.5 rounded-xl shadow-lg shadow-purple-500/30 active:scale-95 transition-all text-sm"
                        >
                            Apply Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default HeaderEditor;
