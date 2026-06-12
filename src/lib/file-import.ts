import type { NormalizationPreset } from "@/lib/types";

function extractTextArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value.map((item) => String(item).trim()).filter(Boolean);
}

export function fileToText(fileName: string, fileText: string, preset: NormalizationPreset) {
  const lowerFileName = fileName.toLowerCase();

  if (lowerFileName.endsWith(".json")) {
    try {
      const parsed = JSON.parse(fileText) as unknown;

      if (Array.isArray(parsed)) {
        return parsed.map((entry) => String(entry).trim()).filter(Boolean).join("\n");
      }

      if (parsed && typeof parsed === "object") {
        const candidate = parsed as Record<string, unknown>;
        const values = [candidate.text, candidate.content, candidate.body, candidate.post, candidate.caption]
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean);

        if (values.length > 0) {
          return values.join("\n");
        }

        const texts = extractTextArray(candidate.items ?? candidate.posts ?? candidate.comments);

        if (texts.length > 0) {
          return texts.join("\n");
        }
      }
    } catch {
      return fileText;
    }
  }

  if (lowerFileName.endsWith(".csv")) {
    return fileText
      .split(/\r?\n/)
      .slice(1)
      .map((row) => row.split(",").slice(1).join(",").replace(/^"|"$/g, "").trim())
      .filter(Boolean)
      .join("\n");
  }

  return fileText;
}
