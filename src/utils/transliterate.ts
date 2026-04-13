import type { Language } from '../i18n';

/**
 * Uses the free, public Google Input Tools API for phonetic transliteration.
 * Excellent for names (e.g., "Hardik" -> "हार्दिक").
 * No API KEY required.
 */
export const transliterateText = async (text: string, targetLang: Language): Promise<string> => {
    if (!text || text.trim().length === 0) return text;
    if (targetLang === 'EN') return text;

    const itc = targetLang === 'HI' ? 'hi-t-i0-und' : 'gu-t-i0-und';
    const url = `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=${itc}&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Transliteration API failed");

        const data = await response.json();
        if (data[0] === "SUCCESS") {
            const result = data[1][0][1][0];
            return result || text;
        }
        return text;
    } catch (error) {
        console.error(`Transliteration error for ${text}:`, error);
        return text;
    }
};

/**
 * Translates/Transliterates multiple fields for a person.
 * Only targets HI and GU.
 */
export const transliteratePersonFields = async (fields: Record<string, string | undefined>) => {
    const results: Record<string, any> = {
        HI: {},
        GU: {}
    };

    for (const [key, value] of Object.entries(fields)) {
        if (value) {
            results.HI[key] = await transliterateText(value, 'HI');
            results.GU[key] = await transliterateText(value, 'GU');
        }
    }

    return results;
};
