import OpenAI from "openai";
import type { NormalizationPreset, NormalizationResult } from "@/lib/types";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

interface Correction {
  original: string;
  corrected: string;
}

function parseCorrections(value: unknown): Correction[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Correction =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as Correction).original === "string" &&
      typeof (item as Correction).corrected === "string" &&
      (item as Correction).original !== (item as Correction).corrected,
  );
}

function clampConfidence(value: unknown): number {
  if (typeof value !== "number") return 0.85;
  return Number(Math.max(0, Math.min(0.99, value)).toFixed(2));
}

function buildPrompt(text: string, preset: NormalizationPreset): string {
  const instructions = {
    social: `You are an expert Uzbek text normalizer. 
I will give you an Uzbek social media post (with slang, spelling mistakes, URLs, mentions, hashtags).
You must return the corrected version in JSON format.

RULES:
- Fix ALL spelling and grammar mistakes
- Convert slang to standard Uzbek
- Remove URLs, mentions (@user), and hashtags (#topic)
- Remove repeated characters (zo'r → zo'r, nimaa → nima)
- Remove filler words (aaa, eee, lol, bro, etc.)
- Keep the original meaning and conversational tone
- Do NOT add periods at the end of sentences
- Do NOT capitalize the first letter

EXAMPLES:
Input: "nma qilyapman bugun story tashladim zo'r bo'ldi!!! https://t.co/demo @user"
Output: {"originalText":"nma qilyapman bugun story tashladim zo'r bo'ldi!!! https://t.co/demo @user","normalizedText":"nima qilayapman bugun story tashladim zo'r bo'ldi","cleanedText":"nima qilayapman bugun story tashladim zo'r bo'ldi","corrections":[{"original":"nma","corrected":"nima"},{"original":"qilyapman","corrected":"qilayapman"}],"tokenCount":7,"languageConfidence":0.95,"preset":"social"}

Input: "sz qandey sz shunaqa deganizni tushundim"
Output: {"normalizedText":"siz qanday siz shunday deganingizni tushundim","corrections":[{"original":"sz","corrected":"siz"},{"original":"qandey","corrected":"qanday"},{"original":"shunaqa","corrected":"shunday"}],"tokenCount":5,"languageConfidence":0.92}

Respond ONLY with valid JSON. No markdown. No code blocks.`,

    formal: `You are an expert Uzbek text normalizer for formal/official documents.
I will give you an Uzbek text with spelling mistakes and informal language.
You must return the corrected, formal version in JSON format.

RULES:
- Fix ALL spelling and grammar mistakes
- Use formal, literary Uzbek
- Capitalize the first letter of the sentence
- Add proper punctuation at the end (period .)
- Remove URLs, mentions, hashtags
- Convert all slang to formal equivalents

EXAMPLE:
Input: "nma qilyapman bugun zo'r kontent tashladim"
Output: {"normalizedText":"Nima qilayapman? Bugun zo'r kontent tashladim.","cleanedText":"Nima qilayapman? Bugun zo'r kontent tashladim.","corrections":[{"original":"nma","corrected":"Nima"},{"original":"qilyapman","corrected":"qilayapman"}],"tokenCount":6,"languageConfidence":0.95,"preset":"formal"}

Respond ONLY with valid JSON. No markdown. No code blocks.`,

    search: `You are an expert Uzbek text normalizer for search indexing.
I will give you an Uzbek text with noise (URLs, mentions, punctuation, slang).
You must return a clean, search-optimized version in JSON format.

RULES:
- Remove ALL punctuation, emojis, special characters
- Convert to lowercase
- Fix spelling mistakes
- Remove URLs, mentions, hashtags
- Keep only meaningful keywords
- Remove filler words (lol, bro, aaa, etc.)
- Simplify text for search

EXAMPLE:
Input: "nma qilyapman bugun zo'r kontent tashladim!!!"
Output: {"normalizedText":"nima qilayapman bugun zor kontent tashladim","cleanedText":"nima qilayapman bugun zor kontent tashladim","corrections":[{"original":"nma","corrected":"nima"},{"original":"qilyapman","corrected":"qilayapman"}],"tokenCount":5,"languageConfidence":0.93,"preset":"search"}

Respond ONLY with valid JSON. No markdown. No code blocks.`,
  };

  return instructions[preset];
}

export async function normalizeWithAI(
  inputText: string,
  preset: NormalizationPreset,
): Promise<NormalizationResult> {
  const client = getOpenAIClient();

  if (!client) {
    // No AI key — return minimal result
    return {
      originalText: inputText,
      cleanedText: inputText,
      normalizedText: inputText,
      slangMap: [],
      tokenCount: inputText.split(/\s+/).filter(Boolean).length,
      languageConfidence: 0.5,
      preset,
    };
  }

  try {
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: buildPrompt(inputText, preset),
        },
        {
          role: "user",
          content: inputText,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty response");

    const data = JSON.parse(raw) as {
      originalText?: string;
      normalizedText?: string;
      cleanedText?: string;
      corrections?: Correction[];
      tokenCount?: number;
      languageConfidence?: number;
      preset?: string;
    };

    const normalizedText = data.normalizedText?.trim() || inputText;
    const cleanedText = data.cleanedText?.trim() || normalizedText;
    const corrections = parseCorrections(data.corrections);
    const tokenCount =
      typeof data.tokenCount === "number" && data.tokenCount > 0
        ? data.tokenCount
        : normalizedText.split(/\s+/).filter(Boolean).length;
    const languageConfidence = clampConfidence(data.languageConfidence);

    return {
      originalText: inputText,
      cleanedText,
      normalizedText,
      slangMap: corrections.map((c) => ({
        original: c.original,
        replacement: c.corrected,
      })),
      tokenCount,
      languageConfidence,
      preset,
    };
  } catch (error) {
    // AI failed — return original text as-is with low confidence
    return {
      originalText: inputText,
      cleanedText: inputText,
      normalizedText: inputText,
      slangMap: [],
      tokenCount: inputText.split(/\s+/).filter(Boolean).length,
      languageConfidence: 0.3,
      preset,
    };
  }
}