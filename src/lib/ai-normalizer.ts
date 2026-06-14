import OpenAI from "openai";

import { normalizeUzbekText } from "@/lib/text-normalizer";
import type { NormalizationPreset, NormalizationResult } from "@/lib/types";

type AIResponseShape = {
  normalizedText?: string;
  corrections?: Array<{ original: string; corrected: string }>;
  tokenCount?: number;
  languageConfidence?: number;
};

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

function clampConfidence(value: unknown, fallback: number) {
  const n = typeof value === "number" ? value : fallback;
  return Number(Math.max(0, Math.min(0.99, n)).toFixed(2));
}

function sanitizeText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

interface Correction {
  original: string;
  corrected: string;
}

function parseCorrections(value: unknown): Correction[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Correction =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as Correction).original === "string" &&
      typeof (item as Correction).corrected === "string"
    )
    .filter((c) => c.original !== c.corrected);
}

function buildSystemPrompt(preset: NormalizationPreset): string {
  const baseInstructions = `
You are an expert Uzbek language text normalizer. Your task is to:
1. Fix spelling and grammar mistakes in Uzbek text
2. Normalize slang and informal expressions to standard Uzbek
3. Remove noise (URLs, mentions, hashtags, repeated characters)
4. Keep the original meaning intact

IMPORTANT: Return ONLY valid JSON with NO markdown, NO code blocks, NO extra text.

JSON format:
{
  "normalizedText": "the normalized text",
  "corrections": [
    { "original": "wrong word", "corrected": "correct word" }
  ],
  "tokenCount": number,
  "languageConfidence": 0.0-0.99
}
`;

  switch (preset) {
    case "social":
      return `${baseInstructions}

PRESET: SOCIAL (social media / casual)
- Fix all spelling mistakes but keep the conversational tone
- Normalize internet slang to standard Uzbek
- Examples:
  Input: "nma qilyapman bugun zo'r kontent tashladim!!!"
  Output: "nima qilayapman bugun zo'r kontent tashladim"
  
  Input: "sz qandey sz shunaqa deganizni tushundim"
  Output: "siz qanday siz shunday deganingizni tushundim"
  
  Input: "bugun story tashladim zo'r bo'ldi!!! https://t.co/demo"
  Output: "bugun story tashladim zo'r bo'ldi"

- Do NOT add periods at end
- Do NOT capitalize first letter
- Fix: nma→nima, qandey→qanday, shunaqa→shunday, qilyapman→qilayapman, etc.`;

    case "formal":
      return `${baseInstructions}

PRESET: FORMAL (official / academic)
- Fix ALL spelling and grammar mistakes
- Use formal, correct literary Uzbek
- Capitalize first letter of the sentence
- Add proper punctuation (period at end)
- Use complete, grammatically correct sentences

Examples:
  Input: "nma qilyapman bugun zo'r kontent tashladim"
  Output: "Nima qilayapman? Bugun zo'r kontent tashladim."
  
  Input: "sz qandey sz shunaqa deganizni tushundim"
  Output: "Siz qanday? Siz shunday deganingizni tushundim."
  
  Input: "bugun story tashladim zo'r bo'ldi https://t.co/demo"
  Output: "Bugun story tashladim, zo'r bo'ldi."`;

    case "search":
      return `${baseInstructions}

PRESET: SEARCH (keywords / indexing)
- Remove all punctuation, emojis, and special characters
- Convert to lowercase
- Keep only meaningful keywords (remove filler words)
- Optimize for search indexing

Examples:
  Input: "nma qilyapman bugun zo'r kontent tashladim!!!"
  Output: "nima qilayapman bugun zor kontent tashladim"
  
  Input: "sz qandey sz shunaqa deganizni tushundim"
  Output: "siz qanday siz shunday deganingizni tushundim"
  
  Input: "bugun story tashladim zo'r bo'ldi!!! https://t.co/demo"
  Output: "bugun story tashladim zor boldi"`;

    default:
      return baseInstructions;
  }
}

export async function normalizeWithAI(inputText: string, preset: NormalizationPreset): Promise<NormalizationResult> {
  const fallback = normalizeUzbekText(inputText, preset);
  const client = getOpenAIClient();

  if (!client) {
    return fallback;
  }

  try {
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(preset),
        },
        {
          role: "user",
          content: JSON.stringify({
            text: inputText,
            preset,
            instructions: `Normalize this Uzbek text using the "${preset}" preset rules above. Fix all spelling mistakes and slang.`,
          }),
        },
      ],
    });

    const rawContent = response.choices[0]?.message?.content;
    if (!rawContent) return fallback;

    const parsed = JSON.parse(rawContent) as AIResponseShape;

    const normalizedText = sanitizeText(parsed.normalizedText, fallback.normalizedText);

    // Build slangMap from corrections
    const corrections = parseCorrections(parsed.corrections);
    const slangMap = corrections.length > 0
      ? corrections.map((c) => ({ original: c.original, replacement: c.corrected }))
      : fallback.slangMap;

    const tokenCount = Number.isFinite(parsed.tokenCount)
      ? Number(parsed.tokenCount)
      : normalizedText.split(/\s+/).filter(Boolean).length;

    const languageConfidence = clampConfidence(
      parsed.languageConfidence,
      Math.min(0.98, fallback.languageConfidence + 0.05),
    );

    // Use AI's normalizedText as both cleaned and normalized
    return {
      originalText: inputText,
      cleanedText: normalizedText,
      normalizedText,
      slangMap,
      tokenCount,
      languageConfidence,
      preset,
    };
  } catch {
    return fallback;
  }
}