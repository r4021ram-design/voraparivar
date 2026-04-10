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
Your task is to accurately translate the provided JSON object containing personal details (Name, Occupation, Bio, Relation, Spouse) from English into both Hindi (HI) and Gujarati (GU).

IMPORTANT RULES:
1. Translate names PHONETICALLY. For example, "Surya" must become "सूर्या" and "સૂર્યા". Do NOT translate names by their meaning (e.g., do not translate Surya into Sun).
2. Translate Occupations, Bios, and Relations naturally and respectfully. 
   - E.g. "Teacher" -> "शिक्षक", "શિક્ષક".
   - Relation: "Son" -> "पुत्र", "પુત્ર"
3. Return ONLY a pure JSON object in the exact structure below. Do not include markdown tags (\`\`\`json) or any conversational text.

Input JSON to translate:
${JSON.stringify(payload, null, 2)}

Expected Output Format:
{
  "HI": {
    "key_from_input": "Hindi Translation",
    ...
  },
  "GU": {
    "key_from_input": "Gujarati Translation",
    ...
  }
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
                generationConfig: {
                    temperature: 0.1,
                    responseMimeType: "application/json",
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
            HI: Record<string, string>;
            GU: Record<string, string>;
        };
    } catch (error) {
        console.error("Gemini Translation Error:", error);
        throw error;
    }
};
