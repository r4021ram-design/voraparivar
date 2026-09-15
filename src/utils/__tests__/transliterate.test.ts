import { describe, it, expect } from 'vitest';
import {
    devanagariToGujarati,
    gujaratiToDevanagari,
    indicToEnglish,
    transliterateTextSync,
    ensurePersonTranslations,
    KNOWN_NAMES_MAP,
} from '../transliterate';
import { getTranslatedContent } from '../../i18n';
import type { Person } from '../../types';

describe('Indic Transliteration & Language Support', () => {
    describe('devanagariToGujarati', () => {
        it('correctly converts Devanagari names to Gujarati script', () => {
            expect(devanagariToGujarati('धर्मदत्त जी')).toBe('ધર્મદત્ત જી');
            expect(devanagariToGujarati('कोकिला बेन')).toBe('કોકિલા બેન');
            expect(devanagariToGujarati('नारायण लाल')).toBe('નારાયણ લાલ');
            expect(devanagariToGujarati('जयन्तीलाल')).toBe('જયન્તીલાલ');
            expect(devanagariToGujarati('पंकज')).toBe('પંકજ');
            expect(devanagariToGujarati('पवन')).toBe('પવન');
        });
    });

    describe('gujaratiToDevanagari', () => {
        it('correctly converts Gujarati names back to Devanagari script', () => {
            expect(gujaratiToDevanagari('ધર્મદત્ત જી')).toBe('धर्मदत्त जी');
            expect(gujaratiToDevanagari('કોકિલા બેન')).toBe('कोकिला बेन');
            expect(gujaratiToDevanagari('નારાયણ લાલ')).toBe('नारायण लाल');
        });
    });

    describe('indicToEnglish', () => {
        it('romanizes Indic names to English phonetic strings', () => {
            expect(indicToEnglish('सुरेश')).toBe('Suresh');
            expect(indicToEnglish('અમિત')).toBe('Amit');
            expect(indicToEnglish('કિરણ')).toBe('Kiran');
        });
    });

    describe('transliterateTextSync', () => {
        it('uses KNOWN_NAMES_MAP for 100% verified Voraparivar names', () => {
            expect(transliterateTextSync('धर्मदत्त जी', 'GU')).toBe('ધર્મદત્ત જી');
            expect(transliterateTextSync('धर्मदत्त जी', 'EN')).toBe('Dharmadatt Ji');
            expect(transliterateTextSync('ધર્મદત્ત જી', 'HI')).toBe('धर्मदत्त जी');
            expect(transliterateTextSync('Dharmadatt Ji', 'GU')).toBe('ધર્મદત્ત જી');
            expect(transliterateTextSync('कोकिला बेन', 'GU')).toBe('કોકિલા બેન');
            expect(transliterateTextSync('कोकिला बेन', 'EN')).toBe('Kokila Ben');
        });
    });

    describe('getTranslatedContent', () => {
        it('translates UI terms into the requested language', () => {
            expect(getTranslatedContent('Son', 'GU')).toBe('પુત્ર');
            expect(getTranslatedContent('Daughter', 'HI')).toBe('पुत्री');
            expect(getTranslatedContent('Mukhya Purush', 'GU')).toBe('મુખ્ય પુરુષ');
        });

        it('translates member names into Gujarati (GU) properly', () => {
            expect(getTranslatedContent('धर्मदत्त जी', 'GU')).toBe('ધર્મદત્ત જી');
            expect(getTranslatedContent('कोकिला बेन', 'GU')).toBe('કોકિલા બેન');
            expect(getTranslatedContent('नारायण लाल', 'GU')).toBe('નારાયણ લાલ');
        });

        it('translates member names into English (EN) properly', () => {
            expect(getTranslatedContent('धर्मदत्त जी', 'EN')).toBe('Dharmadatt Ji');
            expect(getTranslatedContent('कोकिला बेन', 'EN')).toBe('Kokila Ben');
            expect(getTranslatedContent('નારાણ લાલ', 'EN')).toBeDefined();
        });

        it('retains Hindi names when language is HI', () => {
            expect(getTranslatedContent('धर्मदत्त जी', 'HI')).toBe('धर्मदत्त जी');
            expect(getTranslatedContent('કોકિલા બેન', 'HI')).toBe('कोकिला बेन');
        });
    });

    describe('ensurePersonTranslations', () => {
        it('enriches a node hierarchy with full translations for EN, HI, GU', () => {
            const mockPerson: Person = {
                id: 'test-1',
                name: 'धर्मदत्त जी',
                spouse: 'कोकिला बेन',
                relation: 'Son',
                generation: 5,
                children: [
                    {
                        id: 'test-2',
                        name: 'पवन',
                        relation: 'Son',
                        generation: 6,
                        children: []
                    }
                ]
            };

            const enriched = ensurePersonTranslations(mockPerson);

            expect(enriched.translations?.GU?.name).toBe('ધર્મદત્ત જી');
            expect(enriched.translations?.GU?.spouse).toBe('કોકિલા બેન');
            expect(enriched.translations?.EN?.name).toBe('Dharmadatt Ji');
            expect(enriched.translations?.EN?.spouse).toBe('Kokila Ben');

            expect(enriched.children[0].translations?.GU?.name).toBe('પવન');
            expect(enriched.children[0].translations?.EN?.name).toBe('Pawan');
        });
    });

    describe('KNOWN_NAMES_MAP coverage', () => {
        it('contains all essential parivar names', () => {
            expect(KNOWN_NAMES_MAP['छत्रा जी']).toBeDefined();
            expect(KNOWN_NAMES_MAP['भगवान जी']).toBeDefined();
            expect(KNOWN_NAMES_MAP['नान जी']).toBeDefined();
            expect(KNOWN_NAMES_MAP['केवलराम जी']).toBeDefined();
            expect(KNOWN_NAMES_MAP['मोतीराम जी']).toBeDefined();
            expect(KNOWN_NAMES_MAP['धर्मदत्त जी']).toBeDefined();
            expect(KNOWN_NAMES_MAP['कोकिला बेन']).toBeDefined();
        });
    });
});
