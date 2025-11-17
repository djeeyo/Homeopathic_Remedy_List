
import { GoogleGenAI, Type } from "@google/genai";
import type { Remedy } from "../types";

// The API key is injected via Vite's define config.
const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.warn("Gemini API key not found. AI features will be disabled. Please set VITE_API_KEY in your .env file.");
}

export async function getAiSuggestions(symptoms: string, remedies: Remedy[]): Promise<string[]> {
  if (!ai) {
    throw new Error("Gemini API key is not configured. Please set VITE_API_KEY in a .env file and restart the server.");
  }
  
  const remedyListForPrompt = remedies.map(r => r.abbreviation).join(', ');

  const prompt = `
    You are an expert in homeopathy. Based on the following symptoms, suggest the most relevant remedies.
    
    Symptoms: "${symptoms}"
    
    Refer ONLY to the following list of available remedy abbreviations and provide your answer as a JSON object with a single key "remedies" which contains an array of the remedy abbreviations. For example: {"remedies": ["ARN", "NUX-V"]}.
    If no remedies seem appropriate, return an empty array within the JSON object. Do not include any explanation. Your response must be valid JSON.

    Available Remedy Abbreviations:
    ${remedyListForPrompt}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            remedies: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
                description: "The abbreviation of a suggested remedy."
              },
              description: "An array of suggested remedy abbreviations.",
            },
          },
          required: ['remedies'],
        },
      },
    });
    
    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);

    if (result && Array.isArray(result.remedies)) {
      const validAbbreviations = new Set(remedies.map(r => r.abbreviation));
      // FIX: Refactored to use an if-statement to make the type guard more explicit for the TypeScript compiler, ensuring `abbr` is narrowed to a string before use.
      return result.remedies.filter((abbr: unknown): abbr is string => {
        if (typeof abbr === 'string') {
          return validAbbreviations.has(abbr);
        }
        return false;
      });
    }
    
    return [];

  } catch (error) {
    console.error("Error fetching AI suggestions:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to get suggestions from AI. It's possible the API key is invalid or the service is unavailable.`);
    }
    throw new Error("An unknown error occurred while fetching AI suggestions.");
  }
}


export async function getRemedyInfo(remedyName: string): Promise<string> {
  if (!ai) {
    throw new Error("Gemini API key is not configured.");
  }

  const prompt = `Based on the provided Homoeopathic Materia Medica, provide a concise list of the top 3-5 key indicating symptoms for the homeopathic remedy "${remedyName}".
  Format the output as a simple, unstyled HTML string with a main heading (h3) for the remedy name and an unordered list (ul/li) for the symptoms.
  For example: <h3>Arnica Montana</h3><ul><li>Sore, bruised feeling all over.</li><li>Fear of being touched or approached.</li><li>Bed feels too hard.</li></ul>
  Do not include any other text, introductory phrases, or markdown formatting, just the clean HTML output.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error(`Error fetching info for ${remedyName}:`, error);
    if (error instanceof Error) {
        throw new Error(`Failed to get information from AI for ${remedyName}.`);
    }
    throw new Error("An unknown error occurred while fetching remedy information.");
  }
}
