import { ChevronRight, Home } from 'lucide-react';
import type { Person } from '../types';
import { type Language, getTranslatedContent } from '../i18n';

interface BreadcrumbsProps {
    currentNodeId: string | null;
    treeData: Person;
    onNavigate: (nodeId: string) => void;
    language: Language;
}

export default function Breadcrumbs({ currentNodeId, treeData, onNavigate, language }: BreadcrumbsProps) {
    if (!currentNodeId || treeData.id === 'root') return null;

    let path: Person[] = [];
    const findPath = (root: Person, targetId: string, currentPath: Person[]): boolean => {
        if (root.id === targetId) {
            path = [...currentPath, root];
            return true;
        }
        if (root.children) {
            for (const child of root.children) {
                if (findPath(child, targetId, [...currentPath, root])) return true;
            }
        }
        return false;
    }

    findPath(treeData, currentNodeId, []);

    if (path.length === 0) return null;

    const translateName = (person: Person) => {
        if (person.translations?.[language]?.name) {
            return person.translations[language].name;
        }
        return getTranslatedContent(person.name, language);
    };

    return (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[40] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg flex items-center gap-2 max-w-[90vw] overflow-x-auto custom-scrollbar border border-gray-200 dark:border-slate-700 animate-in slide-in-from-top-4 fade-in duration-300">
             <button 
                onClick={() => onNavigate(treeData.id)}
                className="text-gray-400 hover:text-blue-500 transition-colors flex items-center"
                title="Root"
            >
                <Home size={14} />
            </button>
            <ChevronRight size={14} className="text-gray-400 shrink-0" />
            {path.map((p, idx) => (
                <div key={p.id} className="flex items-center gap-2 whitespace-nowrap">
                    <button 
                        onClick={() => onNavigate(p.id)}
                        className={`text-xs font-bold transition-colors ${idx === path.length - 1 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'}`}
                    >
                        {translateName(p)}
                    </button>
                    {idx < path.length - 1 && <ChevronRight size={14} className="text-gray-400 shrink-0" />}
                </div>
            ))}
        </div>
    );
}
