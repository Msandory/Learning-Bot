import { config } from './config';

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

/**
 * Uses Gemini's free-tier API to draft a suggested answer for an open-ended
 * assessment prompt. This is a DRAFT ONLY — per the project's ethical brief,
 * automation never submits on the user's behalf. handleManualAssessment
 * shows this alongside the question so the user can review/edit before
 * typing their own answer into the LMS.
 *
 * Requires GEMINI_API_KEY in .env. If it's not set, this quietly returns
 * null so the caller can fall back to just showing the raw prompt.
 */
export async function draftAnswer(questionPrompt: string, courseContext?: string): Promise<string | null> {
  if (!config.geminiApiKey) {
    return null;
  }

  const model = 'gemini-flash-latest'; // free-tier model; adjust if Google renames/deprecates it
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.geminiApiKey}`;

  const instructions = [
    'You are helping a student draft an answer to a corporate training course reflection question.',
    'Write a genuine, thoughtful first-person draft answer — not a template or placeholder.',
    'Keep it concise (3-5 sentences) unless the question clearly calls for more.',
    courseContext ? `Course context: ${courseContext}` : '',
    `Question: ${questionPrompt}`,
  ].filter(Boolean).join('\n');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: instructions }] }],
      }),
    });

    if (!response.ok) {
      console.warn(`[DRAFT WARN] Gemini API returned ${response.status}. Skipping draft for this question.`);
      return null;
    }

    const data = await response.json() as GeminiResponse;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === 'string' ? text.trim() : null;
  } catch (e) {
    console.warn(`[DRAFT WARN] Failed to reach Gemini API: ${e}`);
    return null;
  }
}