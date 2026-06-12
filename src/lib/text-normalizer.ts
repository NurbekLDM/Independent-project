import type { NormalizationPreset, NormalizationResult } from "@/lib/types";

const slangDictionary: Record<string, string> = {
  szi: "siz",
  sz: "siz",
  qwdim: "qildim",
  qwdimz: "qildim",
  qilyapman: "qilyapman",
  nma: "nima",
  nimaa: "nima",
  yotibman: "yotibman",
  mzz: "mazza",
  "zo'r": "zo'r",
  zor: "zo'r",
  buguncha: "bugun",
  ketyapti: "ketmoqda",
  shunaqa: "shunday",
};

const fillerWords = new Set(["aaa", "eee", "mmm", "uh", "uhh", "like", "bro", "lol"]);

function stripRepeatedCharacters(value: string) {
  return value.replace(/([a-zA-Z--])\1{2,}/g, "$1$1");
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function removeUrlsMentionsHashtags(value: string) {
  return value
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/www\.\S+/gi, " ")
    .replace(/@[\w_]+/g, " ")
    .replace(/#[\w_]+/g, " ");
}

function removeNoiseCharacters(value: string) {
  return value
    .replace(/[“”«»]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[\\/|*^~`]/g, " ")
    .replace(/[!?]{2,}/g, "!")
    .replace(/[.]{3,}/g, ".")
    .replace(/[-_]{2,}/g, " ");
}

function sentenceCase(value: string) {
  const lowered = value.toLowerCase();
  return lowered.charAt(0).toUpperCase() + lowered.slice(1);
}

function tokenize(value: string) {
  return value
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function applyPresetNormalization(value: string, preset: NormalizationPreset) {
  if (preset === "formal") {
    return sentenceCase(value);
  }

  if (preset === "search") {
    return value.toLowerCase();
  }

  return value;
}

export function normalizeUzbekText(inputText: string, preset: NormalizationPreset): NormalizationResult {
  const originalText = inputText;
  const withoutNoise = removeNoiseCharacters(removeUrlsMentionsHashtags(inputText));
  const lowered = withoutNoise.toLowerCase();
  const tokenized = tokenize(lowered)
    .filter((token) => !fillerWords.has(token))
    .map((token) => stripRepeatedCharacters(token));

  const slangMap = tokenized
    .map((token) => ({ original: token, replacement: slangDictionary[token] }))
    .filter((item): item is { original: string; replacement: string } => Boolean(item.replacement));

  const normalizedTokens = tokenized.map((token) => slangDictionary[token] ?? token);
  const cleanedText = normalizeWhitespace(normalizedTokens.join(" "));
  const normalizedText = normalizeWhitespace(applyPresetNormalization(cleanedText, preset));
  const tokenCount = normalizedTokens.length;
  const confidenceBase = tokenCount > 0 ? 0.75 : 0.2;
  const slangCoverage = slangMap.length > 0 ? 0.1 : 0;
  const punctuationBonus = originalText !== cleanedText ? 0.08 : 0;
  const languageConfidence = Number(Math.min(0.98, confidenceBase + slangCoverage + punctuationBonus).toFixed(2));

  return {
    originalText,
    cleanedText,
    normalizedText,
    slangMap,
    tokenCount,
    languageConfidence,
    preset,
  };
}
