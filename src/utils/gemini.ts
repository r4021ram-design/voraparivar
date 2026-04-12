export const translateWithGemini = async (textsToTranslate: Record<string, string | undefined>) => {
    // Filter out undefined or empty values
    const payload: Record<string, string> = {};
    for (const [key, val] of Object.entries(textsToTranslate)) {
        if (val && val.trim().length > 0) {
            payload[key] = val.trim();
        }
    }

    if (Object.keys(payload).length === 0) {
        return null; // Nothing to translate
    }

    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    if (!API_KEY) {
        throw new Error("Missing VITE_GEMINI_API_KEY in environment variables.");
    }

    const prompt = `
You are an expert translator specializing in Indian family history, genealogies, and cultural contexts. 
Your task is to provide accurate versions of the provided JSON object in three languages: English (EN), Hindi (HI), and Gujarati (GU).

The input fields may be in any of these three languages. You must figure out the source language and provide the equivalent in all three.

IMPORTANT RULES:
1. names: You MUST provide a PHONETIC TRANSLITERATION (script conversion) only. 
   - DO NOT translate by meaning. E.g., "Suraj" -> "सूरत" (HI) / "સૂરજ" (GU) / "Suraj" (EN).
   - "राम" -> "Ram" (EN) / "राम" (HI) / "રામ" (GU).
   - "Lord" should NOT be added if not in the input.
2. occupations, relations, bios: Translate these naturally based on the target language's culture.
   - E.g. "Teacher" -> "शिक्षक" (HI) / "શિક્ષक" (GU) / "Teacher" (EN).
   - "Son" -> "पुत्र" (HI) / "પુત્ર" (GU) / "Son" (EN).
3. Return ONLY a pure JSON object in the exact structure below.

Input JSON:
${JSON.stringify(payload, null, 2)}

Expected Output Format:
{
  "EN": { "field": "transliterated/translated text", ... },
  "HI": { "field": "transliterated/translated text", ... },
  "GU": { "field": "transliterated/translated text", ... }
}
`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generation_config: {
                    temperature: 0.1,
                    response_mime_type: "application/json",
                }
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || "Failed to fetch from Gemini API");
        }

        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!textResponse) {
            throw new Error("Invalid response format from Gemini API");
        }

        const parsed = JSON.parse(textResponse);
        return parsed as {
            EN: Record<string, string>;
            HI: Record<string, string>;
            GU: Record<string, string>;
        };
    } catch (error) {
        console.error("Gemini Translation Error:", error);
        throw error;
    }
};
