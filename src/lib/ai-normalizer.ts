import OpenAI from "openai";

import { normalizeUzbekText } from "@/lib/text-normalizer";
import type { NormalizationPreset, NormalizationResult } from "@/lib/types";

type AIResponseShape = {
  cleanedText?: string;
  normalizedText?: string;
  slangMap?: Array<{ original: string; replacement: string }>;
  tokenCount?: number;
  languageConfidence?: number;
};

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new OpenAI({ apiKey });
}

function clampConfidence(value: unknown, fallback: number) {
  const numericValue = typeof value === "number" ? value : fallback;
  return Number(Math.max(0, Math.min(0.99, numericValue)).toFixed(2));
}

function sanitizeText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function normalizeSlangMap(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as Array<{ original: string; replacement: string }>;
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const original = typeof (item as { original?: unknown }).original === "string" ? (item as { original: string }).original.trim() : "";
      const replacement = typeof (item as { replacement?: unknown }).replacement === "string" ? (item as { replacement: string }).replacement.trim() : "";

      if (!original || !replacement) {
        return null;
      }

      return { original, replacement };
    })
    .filter((item): item is { original: string; replacement: string } => Boolean(item));
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
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You normalize Uzbek social media text. Remove noise, URLs, mentions, duplicated characters, slang, and punctuation clutter while preserving meaning. Return only JSON.",
        },
        {
          role: "user",
          content: JSON.stringify({ text: inputText, preset }),
        },
      ],
    });

    const rawContent = response.choices[0]?.message?.content;

    if (!rawContent) {
      return fallback;
    }

    const parsed = JSON.parse(rawContent) as AIResponseShape;

    const cleanedText = sanitizeText(parsed.cleanedText, fallback.cleanedText);
    const normalizedText = sanitizeText(parsed.normalizedText, fallback.normalizedText);
    const slangMap = normalizeSlangMap(parsed.slangMap);
    const tokenCount = Number.isFinite(parsed.tokenCount) ? Number(parsed.tokenCount) : fallback.tokenCount;
    const languageConfidence = clampConfidence(parsed.languageConfidence, Math.min(0.98, fallback.languageConfidence + 0.05));

    return {
      originalText: inputText,
      cleanedText,
      normalizedText,
      slangMap: slangMap.length > 0 ? slangMap : fallback.slangMap,
      tokenCount,
      languageConfidence,
      preset,
    };
  } catch {
    return fallback;
  }
}
