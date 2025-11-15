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
    throw new Error("Gemini API key is not configured. Please set VITE_API_KEY in a .env.local file and restart the server.");
  }
  
  const remedyListForPrompt = remedies.map(r => `- ${r.name} (${r.abbreviation})`).join('\n');

  const prompt = `
    You are an expert in homeopathy. Based on the following symptoms, suggest the most relevant remedies.
    
    Symptoms: "${symptoms}"
    
    Refer ONLY to the following list of available remedies and provide your answer as a JSON object with a single key "remedies" which contains an array of the remedy abbreviations. For example: {"remedies": ["ARN", "NUX-V"]}.
    If no remedies seem appropriate, return an empty array within the JSON object. Do not include any explanation.

    Available Remedies:
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
      // FIX: Add a type predicate `: abbr is string` to ensure the filter returns a properly typed `string[]`.
      // This prevents downstream errors where array elements are incorrectly treated as `unknown`.
      return result.remedies.filter((abbr: unknown): abbr is string => typeof abbr === 'string' && validAbbreviations.has(abbr));
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
