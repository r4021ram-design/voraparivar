/**
 * Unified tree action definitions.
 *
 * Both the desktop toolbar and mobile navigation drawers render from the same
 * action list, eliminating duplication and preventing UI drift.
 */

import type { LucideIcon } from 'lucide-react';
import type { Person } from '../../../types/person';

export interface TreeAction {
    id: string;
    label: string;
    icon: LucideIcon;
    onClick: () => void;
    className?: string;
    disabled?: boolean;
    /** Only shown for these roles. Omit for all roles. */
    requiredRole?: 'ADMIN' | 'STANDARD';
    /** Custom component to render instead of a button (e.g. FileUpload). */
    customComponent?: React.ReactNode;
}

export interface TreeActionContext {
    userRole: string;
    t: Record<string, string>;
    handlers: {
        openSearch: () => void;
        openTimeline: () => void;
        openCommunity: () => void;
        openHeaderEditor: () => void;
        export: () => void;
        exportImage: () => void;
        exportPDF: () => void;
        print: () => void;
        reset: () => void;
        resetFromBackup: () => void;
        migrate: () => void;
        bulkTranslate: () => void;
        onDataLoaded: (data: Person) => void;
    };
    isBulkTranslating?: boolean;
}

export interface SettingsActionContext {
    userRole: string;
    language: string;
    theme: string;
    onSetLanguage: (lang: string) => void;
    onSetTheme: (theme: string) => void;
    onLogout: () => void;
}
