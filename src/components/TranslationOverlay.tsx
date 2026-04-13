import React, { useEffect } from 'react';
import { Wand2 } from 'lucide-react';

interface TranslationOverlayProps {
    progress: { current: number; total: number } | null;
}

const TranslationOverlay: React.FC<TranslationOverlayProps> = ({ progress }) => {
    useEffect(() => {
        if (progress) {
            const percentage = (progress.current / progress.total) * 100;
            const progressBar = document.getElementById('ai-translation-progress-bar');
            if (progressBar) {
                progressBar.style.width = `${percentage}%`;
            }
        }
    }, [progress]);

    if (!progress) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[200] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                        <Wand2 size={24} className="animate-pulse" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">AI Bulk Translation</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Processing your family tree...
                        </p>
                    </div>
                    
                    {/* Progress Bar Container */}
                    <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden mt-2">
                        <div 
                            id="ai-translation-progress-bar"
                            className="bg-purple-500 h-full transition-all duration-500"
                        />
                    </div>
                    
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        {progress.current} OF {progress.total} MEMBERS
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TranslationOverlay;
