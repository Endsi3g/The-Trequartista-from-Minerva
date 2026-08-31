import { GoogleGenAI } from '@google/genai';

// Shared lazy Gemini client for the two in-app AI bots (Coach Minerva,
// help chatbot) -- same spirit as the Anthropic client construction in
// app/api/audits/[id]/extract/route.ts (never instantiate without a real
// key, never fabricate a response when the key is missing), but Gemini
// rather than Claude per an explicit product decision. Both bots stay
// inert in this environment until GEMINI_API_KEY is set in production.
export const GEMINI_MODEL = 'gemini-3.7-flash';

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

export const GEMINI_NOT_CONFIGURED_ERROR =
  "Cette fonctionnalité IA n'est pas configurée sur cet environnement (GEMINI_API_KEY manquante).";

// Best-effort single-string generation with a plain-text fallback if the
// call fails -- callers pass the fallback so a bot message still goes out
// (with honest, non-personalized copy) rather than silently doing nothing.
export async function generateGeminiText(prompt: string, fallback: string): Promise<string> {
  const client = getGeminiClient();
  if (!client) return fallback;
  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });
    const text = response.text?.trim();
    return text || fallback;
  } catch (err) {
    console.warn('[Gemini] generateGeminiText failed, using fallback:', err);
    return fallback;
  }
}
