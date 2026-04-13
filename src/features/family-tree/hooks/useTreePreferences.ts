/**
 * Tree preferences hook — manages theme, language, font scale, privacy,
 * header content, and edge styling settings.
 *
 * Extracted from FamilyTreeFlow to reduce component state clutter.
 */

import { useState, useCallback } from 'react';
import type { Language } from '../../../i18n';
import type { Theme, FontScale } from '../../../types/ui';

export const useTreePreferences = () => {
    const [language, setLanguage] = useState<Language>('EN');
    const [theme, setTheme] = useState<Theme>('light');
    const [fontScale, setFontScale] = useState<FontScale>('md');
    const [isPrivacyMode, setIsPrivacyMode] = useState(false);

    // Header Content State (persisted to localStorage)
    const [headerVerse, setHeaderVerse] = useState(() =>
        localStorage.getItem('vanshavali_header_verse_v1') ??
        "अत्रि गोत्रोत्पन्नाः वयं, यजुर्वेदीय-माध्यन्दिनि-शाखाध्यायिनः; सहस्र-औदीच्य-गोरवाल-ब्राह्मणाः — धर्मरक्षणाय समर्पिताः।"
    );
    const [headerTitle, setHeaderTitle] = useState(() =>
        localStorage.getItem('vanshavali_header_title_v1') ??
        "वोरा वंशावली"
    );
    const [isEditingHeader, setIsEditingHeader] = useState(false);

    // Custom Branch Styling
    const [edgeColor, setEdgeColor] = useState('#8B4513');
    const [edgeWidth, setEdgeWidth] = useState(4);

    const handleSaveHeader = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('vanshavali_header_verse_v1', headerVerse);
        localStorage.setItem('vanshavali_header_title_v1', headerTitle);
        setIsEditingHeader(false);
    }, [headerVerse, headerTitle]);

    return {
        // Language / Theme / Font
        language, setLanguage,
        theme, setTheme,
        fontScale, setFontScale,
        isPrivacyMode, setIsPrivacyMode,

        // Header
        headerVerse, setHeaderVerse,
        headerTitle, setHeaderTitle,
        isEditingHeader, setIsEditingHeader,
        handleSaveHeader,

        // Edge styling
        edgeColor, setEdgeColor,
        edgeWidth, setEdgeWidth,
    };
};
