import type { Language } from '../i18n';
import type { Person } from '../types';

/**
 * Standard known names in the Voraparivar Family Tree with verified spellings
 * across English (EN), Hindi (HI), and Gujarati (GU).
 */
export const KNOWN_NAMES_MAP: Record<string, { EN: string; HI: string; GU: string }> = {
    'अशोक जी': { EN: 'Ashok Ji', HI: 'अशोक जी', GU: 'અશોક જી' },
    'इंद्री बाई': { EN: 'Indri Bai', HI: 'इंद्री बाई', GU: 'ઇંદ્રી બાઈ' },
    'इन्द्रलाल जी': { EN: 'Indralal Ji', HI: 'इन्द्रलाल जी', GU: 'ઇન્દ્રલાલ જી' },
    'उमाशंकर जी': { EN: 'Umashankar Ji', HI: 'उमाशंकर जी', GU: 'ઉમાશંકર જી' },
    'कामिनी': { EN: 'Kamini', HI: 'कामिनी', GU: 'કામિની' },
    'कार्तिक': { EN: 'Kartik', HI: 'कार्तिक', GU: 'કાર્તિક' },
    'कीर्ति': { EN: 'Kirti', HI: 'कीर्ति', GU: 'કીર્તિ' },
    'केतन': { EN: 'Ketan', HI: 'केतन', GU: 'કેતન' },
    'केवलराम जी': { EN: 'Kevalram Ji', HI: 'केवलराम जी', GU: 'કેવલરામ જી' },
    'केशवलाल जी': { EN: 'Keshavlal Ji', HI: 'केशवलाल जी', GU: 'કેશવલાલ જી' },
    'कोकिला बेन': { EN: 'Kokila Ben', HI: 'कोकिला बेन', GU: 'કોકિલા બેન' },
    'गंगा बाई': { EN: 'Ganga Bai', HI: 'गंगा बाई', GU: 'ગંગા બાઈ' },
    'गोविंद जी': { EN: 'Govind Ji', HI: 'गोविंद जी', GU: 'ગોવિંદ જી' },
    'चंदा बेन': { EN: 'Chanda Ben', HI: 'चंदा बेन', GU: 'ચંદા બેન' },
    'चिमनलाल  जी': { EN: 'Chimanlal Ji', HI: 'चिमनलाल  जी', GU: 'ચિમનલાલ  જી' },
    'चिमनलाल जी': { EN: 'Chimanlal Ji', HI: 'चिमनलाल जी', GU: 'ચિમનલાલ જી' },
    'चिराग': { EN: 'Chirag', HI: 'चिराग', GU: 'ચિરાગ' },
    'चुनीलाल जी': { EN: 'Chunilal Ji', HI: 'चुनीलाल जी', GU: 'ચુનીલાલ જી' },
    'छगनलाल जी': { EN: 'Chhaganlal Ji', HI: 'छगनलाल जी', GU: 'છગનલાલ જી' },
    'छत्रा जी': { EN: 'Chhatra Ji', HI: 'छत्रा जी', GU: 'છત્રા જી' },
    'जतिन': { EN: 'Jatin', HI: 'जतिन', GU: 'જતિન' },
    'जयन्तीलाल': { EN: 'Jayantilal', HI: 'जयन्तीलाल', GU: 'જયન્તીલાલ' },
    'जयश्री बेन': { EN: 'Jayashree Ben', HI: 'जयश्री बेन', GU: 'જયશ્રી બેન' },
    'जीतू': { EN: 'Jitu', HI: 'जीतू', GU: 'જીતૂ' },
    'तरुण': { EN: 'Tarun', HI: 'तरुण', GU: 'તરુણ' },
    'तुलसीबाई': { EN: 'Tulsibai', HI: 'तुलसीबाई', GU: 'તુલસીબાઈ' },
    'तेजराम जी': { EN: 'Tejram Ji', HI: 'तेजराम जी', GU: 'તેજરામ જી' },
    'दला जी': { EN: 'Dala Ji', HI: 'दला जी', GU: 'દલા જી' },
    'दिपक': { EN: 'Deepak', HI: 'दिपक', GU: 'દિપક' },
    'दीप्ति': { EN: 'Deepti', HI: 'दीप्ति', GU: 'દીપ્તિ' },
    'देवांग': { EN: 'Devang', HI: 'देवांग', GU: 'દેવાંગ' },
    'देवेन्द्र': { EN: 'Devendra', HI: 'देवेन्द्र', GU: 'દેવેન્દ્ર' },
    'धर्मदत्त जी': { EN: 'Dharmadatt Ji', HI: 'धर्मदत्त जी', GU: 'ધર્મદત્ત જી' },
    'नटवर लाल': { EN: 'Natwarlal', HI: 'नटवर लाल', GU: 'નટવર લાલ' },
    'नयना बेन': { EN: 'Nayana Ben', HI: 'नयना बेन', GU: 'નયના બેન' },
    'नरेश': { EN: 'Naresh', HI: 'नरेश', GU: 'નરેશ' },
    'नाथालाल जी': { EN: 'Nathalal Ji', HI: 'नाथालाल जी', GU: 'નાથાલાલ જી' },
    'नान जी': { EN: 'Nan Ji', HI: 'नान जी', GU: 'નાન જી' },
    'नारायण लाल': { EN: 'Narayan Lal', HI: 'नारायण लाल', GU: 'નારાયણ લાલ' },
    'निखिल (गटु)': { EN: 'Nikhil (Gatu)', HI: 'निखिल (गटु)', GU: 'નિખિલ (ગટુ)' },
    'पंकज': { EN: 'Pankaj', HI: 'पंकज', GU: 'પંકજ' },
    'पनि बाई': { EN: 'Pani Bai', HI: 'पनि बाई', GU: 'પનિ બાઈ' },
    'पवन': { EN: 'Pawan', HI: 'पवन', GU: 'પવન' },
    'पूर्णिमा बेन ( जीया )': { EN: 'Purnima Ben (Jiya)', HI: 'पूर्णिमा बेन ( जीया )', GU: 'પૂર્ણિમા બેન ( જીયા )' },
    'पूर्वी': { EN: 'Poorvi', HI: 'पूर्वी', GU: 'પૂર્વી' },
    'प्रशांत': { EN: 'Prashant', HI: 'प्रशांत', GU: 'પ્રશાંત' },
    'बिन्दु बेन': { EN: 'Bindu Ben', HI: 'बिन्दु बेन', GU: 'બિન્દુ બેન' },
    'बिपिन': { EN: 'Bipin', HI: 'बिपिन', GU: 'બિપિન' },
    'बीना': { EN: 'Beena', HI: 'बीना', GU: 'બીના' },
    'बीना बेन': { EN: 'Beena Ben', HI: 'बीना बेन', GU: 'બીના બેન' },
    'भगवान जी': { EN: 'Bhagwan Ji', HI: 'भगवान जी', GU: 'ભગવાન જી' },
    'भारती बेन': { EN: 'Bharti Ben', HI: 'भारती बेन', GU: 'ભારતી બેન' },
    'भावना': { EN: 'Bhavana', HI: 'भावना', GU: 'ભાવના' },
    'मंछा जी': { EN: 'Mancha Ji', HI: 'मंछा जी', GU: 'મંછા જી' },
    'मगन जी': { EN: 'Magan Ji', HI: 'मगन जी', GU: 'મગન જી' },
    'ममता बेन': { EN: 'Mamta Ben', HI: 'ममता बेन', GU: 'મમતા બેન' },
    'मयूर': { EN: 'Mayur', HI: 'मयूर', GU: 'મયૂર' },
    'मिठीबाई': { EN: 'Mithibai', HI: 'मिठीबाई', GU: 'મિઠીબાઈ' },
    'मोतीराम जी': { EN: 'Motiram Ji', HI: 'मोतीराम जी', GU: 'મોતીરામ જી' },
    'रमिलाबेन': { EN: 'Ramilaben', HI: 'रमिलाबेन', GU: 'રમિલાબેન' },
    'रमेश': { EN: 'Ramesh', HI: 'रमेश', GU: 'રમેશ' },
    'रविंद्र': { EN: 'Ravindra', HI: 'रविंद्र', GU: 'રવિંદ્ર' },
    'राजूभाई': { EN: 'Rajubhai', HI: 'राजूभाई', GU: 'રાજૂભાઈ' },
    'रोहित': { EN: 'Rohit', HI: 'रोहित', GU: 'રોહિત' },
    'लीला बेन': { EN: 'Leela Ben', HI: 'लीला बेन', GU: 'લીલા બેન' },
    'वरदी शंकर जी': { EN: 'Vardi Shankar Ji', HI: 'वरदी शंकर जी', GU: 'વરદી શંકર જી' },
    'विनोद महाराज': { EN: 'Vinod Maharaj', HI: 'विनोद महाराज', GU: 'વિનોદ મહારાજ' },
    'विश्वनाथ जी': { EN: 'Vishwanath Ji', HI: 'विश्वनाथ जी', GU: 'વિશ્વનાથ જી' },
    'शकुंतला बेन': { EN: 'Shakuntala Ben', HI: 'शकुंतला बेन', GU: 'શકુંતલા બેન' },
    'शारदा बेन': { EN: 'Sharda Ben', HI: 'शारदा बेन', GU: 'શારદા બેન' },
    'साँकला जी': { EN: 'Sankala Ji', HI: 'साँकला जी', GU: 'સાઁકલા જી' },
    'साँकली बाई': { EN: 'Sankali Bai', HI: 'साँकली बाई', GU: 'સાઁકલી બાઈ' },
    'सावित्री': { EN: 'Savitri', HI: 'सावित्री', GU: 'સાવિત્રી' },
    'हिंमतराम जी': { EN: 'Himmatram Ji', HI: 'हिंमतराम जी', GU: 'હિંમતરામ જી' },
    'हितेश': { EN: 'Hitesh', HI: 'हितेश', GU: 'હિતેશ' },
    'हिना': { EN: 'Heena', HI: 'हिना', GU: 'હિના' },
    'हिरालाल': { EN: 'Hiralal', HI: 'हिरालाल', GU: 'હિરાલાલ' },
    'हेत': { EN: 'Het', HI: 'हेत', GU: 'હેત' },
    'हेमंत': { EN: 'Hemant', HI: 'हेमंत', GU: 'હેમંત' }
};

// Also index KNOWN_NAMES_MAP by Gujarati and English names for bidirectional fast lookup
const FAST_NAME_LOOKUP = new Map<string, { EN: string; HI: string; GU: string }>();
for (const entry of Object.values(KNOWN_NAMES_MAP)) {
    FAST_NAME_LOOKUP.set(entry.HI.trim().toLowerCase(), entry);
    FAST_NAME_LOOKUP.set(entry.GU.trim().toLowerCase(), entry);
    FAST_NAME_LOOKUP.set(entry.EN.trim().toLowerCase(), entry);
}

/**
 * High-speed Unicode-based mathematical transliterator: Devanagari to Gujarati.
 * Devanagari (0x0900..0x097F) maps to Gujarati (0x0A80..0x0AFF) via a +0x0180 offset.
 */
export const devanagariToGujarati = (text: string): string => {
    if (!text) return '';
    return text.replace(/[\u0900-\u097F]/g, char => {
        const code = char.charCodeAt(0);
        return String.fromCharCode(code + 0x0180);
    });
};

/**
 * High-speed Unicode-based mathematical transliterator: Gujarati to Devanagari.
 * Gujarati (0x0A80..0x0AFF) maps to Devanagari (0x0900..0x097F) via a -0x0180 offset.
 */
export const gujaratiToDevanagari = (text: string): string => {
    if (!text) return '';
    return text.replace(/[\u0A80-\u0AFF]/g, char => {
        const code = char.charCodeAt(0);
        return String.fromCharCode(code - 0x0180);
    });
};

const INDIC_VOWELS: Record<string, string> = {
    'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo', 'ऋ': 'ri',
    'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
    'અ': 'a', 'આ': 'aa', 'ઇ': 'i', 'ઈ': 'ee', 'ઉ': 'u', 'ઊ': 'oo', 'ઋ': 'ri',
    'એ': 'e', 'ઐ': 'ai', 'ઓ': 'o', 'ઔ': 'au'
};

const INDIC_MATRAS: Record<string, string> = {
    'ा': 'a', 'ि': 'i', 'ी': 'i', 'ु': 'u', 'ू': 'u', 'ृ': 'ri',
    'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', '्': '',
    'ા': 'a', 'િ': 'i', 'ી': 'i', 'ુ': 'u', 'ૂ': 'u', 'ૃ': 'ri',
    'ે': 'e', 'ૈ': 'ai', 'ો': 'o', 'ૌ': 'au', '્': ''
};

const ANUSVARA_CHARS = new Set(['ं', 'ँ', 'ં', 'ઁ']);

const INDIC_CONSONANTS: Record<string, string> = {
    'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
    'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
    'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
    'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
    'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
    'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v',
    'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
    'ક': 'k', 'ખ': 'kh', 'ગ': 'g', 'ઘ': 'gh', 'ઙ': 'ng',
    'ચ': 'ch', 'છ': 'chh', 'જ': 'j', 'ઝ': 'jh', 'ઞ': 'ny',
    'ટ': 't', 'ઠ': 'th', 'ડ': 'd', 'ઢ': 'dh', 'ણ': 'n',
    'ત': 't', 'થ': 'th', 'દ': 'd', 'ધ': 'dh', 'ન': 'n',
    'પ': 'p', 'ફ': 'ph', 'બ': 'b', 'ભ': 'bh', 'મ': 'm',
    'ય': 'y', 'ર': 'r', 'લ': 'l', 'વ': 'v',
    'શ': 'sh', 'ષ': 'sh', 'સ': 's', 'હ': 'h', 'ળ': 'l'
};

/**
 * Phonetic Romanization of Devanagari or Gujarati text into clean English.
 */
export const indicToEnglish = (text: string): string => {
    if (!text) return '';
    let out = '';
    const len = text.length;

    for (let i = 0; i < len; i++) {
        const ch = text[i];
        if (INDIC_VOWELS[ch]) {
            out += INDIC_VOWELS[ch];
        } else if (INDIC_CONSONANTS[ch]) {
            const c = INDIC_CONSONANTS[ch];
            const next = text[i + 1];
            if (next && ANUSVARA_CHARS.has(next)) {
                out += c + 'an';
                i++;
            } else if (next && INDIC_MATRAS[next] !== undefined) {
                out += c + INDIC_MATRAS[next];
                i++;
            } else if (next && (INDIC_CONSONANTS[next] || INDIC_VOWELS[next])) {
                out += c + 'a';
            } else {
                out += c;
            }
        } else if (ANUSVARA_CHARS.has(ch)) {
            out += 'n';
        } else {
            out += ch;
        }
    }

    // Capitalize each word nicely
    return out.replace(/\b[a-z]/g, s => s.toUpperCase());
};

/**
 * Synchronously transliterates or translates any text to target language.
 * Completely offline, instant, zero external dependencies.
 */
export const transliterateTextSync = (text: string | undefined, targetLang: Language): string => {
    if (!text) return '';
    const trimmed = text.trim();
    if (!trimmed) return '';

    // 1. Check known family names map
    const known = FAST_NAME_LOOKUP.get(trimmed.toLowerCase());
    if (known) {
        return known[targetLang];
    }

    const hasDevanagari = /[\u0900-\u097F]/.test(trimmed);
    const hasGujarati = /[\u0A80-\u0AFF]/.test(trimmed);

    if (targetLang === 'GU') {
        if (hasDevanagari) return devanagariToGujarati(trimmed);
        return trimmed;
    }

    if (targetLang === 'HI') {
        if (hasGujarati) return gujaratiToDevanagari(trimmed);
        return trimmed;
    }

    if (targetLang === 'EN') {
        if (hasDevanagari || hasGujarati) {
            return indicToEnglish(trimmed);
        }
        return trimmed;
    }

    return trimmed;
};

/**
 * Asynchronous transliteration interface for backward compatibility.
 * Falls back to offline synchronous transliteration instantly.
 */
export const transliterateText = async (text: string, targetLang: Language): Promise<string> => {
    if (!text || text.trim().length === 0) return text;
    if (targetLang === 'EN') {
        return transliterateTextSync(text, 'EN');
    }

    // First try synchronous known names and instant transliteration
    const syncResult = transliterateTextSync(text, targetLang);
    if (syncResult && syncResult !== text) {
        return syncResult;
    }

    // Optional online phonetic fallback if English source
    const itc = targetLang === 'HI' ? 'hi-t-i0-und' : 'gu-t-i0-und';
    const url = `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=${itc}&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();
            if (data[0] === 'SUCCESS') {
                const result = data[1][0][1][0];
                if (result) return result;
            }
        }
    } catch {
        // Silently fallback to sync result
    }

    return syncResult || text;
};

/**
 * Translates/Transliterates multiple fields for a person across HI and GU.
 */
export const transliteratePersonFields = async (fields: Record<string, string | undefined>) => {
    const results: Record<'HI' | 'GU', Record<string, string>> = {
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

/**
 * Recursively enriches a person tree node so that person.translations has full
 * coverage across EN, HI, and GU for name, spouse, relation, and occupation.
 */
export const ensurePersonTranslations = (node: Person): Person => {
    const currentTrans = node.translations || {};

    const enName = currentTrans.EN?.name || transliterateTextSync(node.name, 'EN');
    const hiName = currentTrans.HI?.name || transliterateTextSync(node.name, 'HI');
    const guName = currentTrans.GU?.name || transliterateTextSync(node.name, 'GU');

    const enSpouse = node.spouse ? (currentTrans.EN?.spouse || transliterateTextSync(node.spouse, 'EN')) : undefined;
    const hiSpouse = node.spouse ? (currentTrans.HI?.spouse || transliterateTextSync(node.spouse, 'HI')) : undefined;
    const guSpouse = node.spouse ? (currentTrans.GU?.spouse || transliterateTextSync(node.spouse, 'GU')) : undefined;

    const enrichedTranslations: Person['translations'] = {
        EN: {
            ...currentTrans.EN,
            name: enName,
            spouse: enSpouse,
            relation: currentTrans.EN?.relation || node.relation,
            occupation: currentTrans.EN?.occupation || node.occupation,
        },
        HI: {
            ...currentTrans.HI,
            name: hiName,
            spouse: hiSpouse,
            relation: currentTrans.HI?.relation || transliterateTextSync(node.relation, 'HI'),
            occupation: currentTrans.HI?.occupation || transliterateTextSync(node.occupation, 'HI'),
        },
        GU: {
            ...currentTrans.GU,
            name: guName,
            spouse: guSpouse,
            relation: currentTrans.GU?.relation || transliterateTextSync(node.relation, 'GU'),
            occupation: currentTrans.GU?.occupation || transliterateTextSync(node.occupation, 'GU'),
        },
    };

    return {
        ...node,
        translations: enrichedTranslations,
        children: node.children ? node.children.map(ensurePersonTranslations) : [],
    };
};
