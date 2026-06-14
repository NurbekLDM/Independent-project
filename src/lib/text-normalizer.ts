import type { NormalizationPreset, NormalizationResult } from "@/lib/types";

// ─── Imlo lug'ati (xato → to'g'ri) ───
const spellingDictionary: Record<string, string> = {
  nma: "nima",
  nimaa: "nima",
  nime: "nima",
  nimaga: "nima",
  nmmaga: "nimaga",
  qale: "qanday",
  qandey: "qanday",
  qanaqa: "qanday",
  qnq: "qanday",
  undey: "unday",
  bunaqa: "bunday",
  shunaqa: "shunday",
  shunaqangi: "shunday",
  munaqa: "bunday",
  zor: "zor",
  zrr: "zor",
  raxmat: "rahmat",
  rah: "rahmat",
  xop: "xop",
  yuq: "yuq",
  yu: "yuq",
  yq: "yuq",
  yuk: "yuq",
  bmr: "bor",
  qconv: "qachon",
  qwdim: "qildim",
  qwdimz: "qildim",
  qilyapman: "qilayapman",
  qilyapmiz: "qilayapmiz",
  qilyapti: "qilayapti",
  ketyapman: "ketayapman",
  ketyapti: "ketayapti",
  ketyapmiz: "ketayapmiz",
  boryapman: "borayapman",
  boryapti: "borayapti",
  kelyapman: "kelayapman",
  kelyapti: "kelayapti",
  beryapman: "berayapman",
  qilgandim: "qilgan edim",
  szi: "siz",
  sz: "siz",
};

const socialReplacements: Record<string, string> = {
  nma: "nima",
  qale: "qalay",
  qandey: "qanday",
  qanaqa: "qanday",
  shunaqa: "shunday",
  zor: "zor",
  raxmat: "rahmat",
  yuq: "yoq",
  qilgan: "qilgan",
  kelgan: "kelgan",
  borgan: "borgan",
  ketgan: "ketgan",
  bergan: "bergan",
  olgan: "olgan",
  aytgan: "aytgan",
  degan: "degan",
  ishlagan: "ishlagan",
  yozgan: "yozgan",
  bilgan: "bilgan",
};

const fillerWords = new Set([
  "aaa", "eee", "mmm", "uh", "uhh", "hmm", "haa", "hee",
  "lol", "bro", "dude", "omg", "wtf",
]);

// ─── Tozalash funksiyalari ───

function stripRepeatedChars(value: string) {
  return value.replace(/([a-zA-Z])\1{2,}/g, "$1$1");
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function removeUrls(value: string) {
  return value
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/www\.\S+/gi, " ");
}

function removeMentionsAndHashtags(value: string) {
  return value
    .replace(/@[\w_.]+/g, " ")
    .replace(/#[\w_]+/g, " ");
}

function cleanPunctuation(value: string) {
  return value
    .replace(/[""""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[\\/|*^~`_]/g, " ")
    .replace(/[!?]{2,}/g, "!")
    .replace(/[.]{3,}/g, ".")
    .replace(/[-]{2,}/g, " ");
}

function tokenize(value: string) {
  return value
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function applyPreset(cleanedText: string, preset: NormalizationPreset): string {
  switch (preset) {
    case "social":
      return cleanedText;
    case "formal": {
      let formal = cleanedText;
      formal = formal.charAt(0).toUpperCase() + formal.slice(1);
      if (!formal.endsWith(".") && !formal.endsWith("!") && !formal.endsWith("?")) {
        formal += ".";
      }
      return formal;
    }
    case "search":
      return cleanedText
        .toLowerCase()
        .replace(/[.,!?;:'"()]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    default:
      return cleanedText;
  }
}

function calculateConfidence(
  originalText: string,
  normalizedText: string,
  slangCount: number,
  tokenCount: number,
): number {
  if (tokenCount === 0) return 0.2;
  let confidence = 0.7;
  if (originalText !== normalizedText) confidence += 0.08;
  if (slangCount > 0) confidence += Math.min(0.12, slangCount * 0.03);
  if (tokenCount < 3) confidence -= 0.1;
  if (tokenCount > 20) confidence += 0.05;
  return Number(Math.min(0.98, confidence).toFixed(2));
}

// ─── Asosiy normalizatsiya ───

export function normalizeUzbekText(inputText: string, preset: NormalizationPreset): NormalizationResult {
  const originalText = inputText;

  let text = removeUrls(originalText);
  text = removeMentionsAndHashtags(text);
  text = cleanPunctuation(text);
  text = text.toLowerCase();

  const tokens = tokenize(text)
    .filter((token) => !fillerWords.has(token))
    .map((token) => stripRepeatedChars(token));

  const fullDict = { ...spellingDictionary, ...socialReplacements };

  const slangMap = tokens
    .map((token) => ({
      original: token,
      replacement: fullDict[token],
    }))
    .filter((item): item is { original: string; replacement: string } =>
      Boolean(item.replacement) && item.replacement !== item.original,
    );

  const normalizedTokens = tokens.map((token) => fullDict[token] ?? token);

  const cleanedText = normalizeWhitespace(
    normalizedTokens.filter((t) => t.length > 0).join(" "),
  );

  const normalizedText = normalizeWhitespace(applyPreset(cleanedText, preset));

  const tokenCount = normalizedTokens.filter((t) => t.length > 0).length;
  const languageConfidence = calculateConfidence(originalText, normalizedText, slangMap.length, tokenCount);

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