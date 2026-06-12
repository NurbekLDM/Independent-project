import { describe, expect, it } from "vitest";

import { normalizeUzbekText } from "./text-normalizer";

describe("normalizeUzbekText", () => {
  it("removes social media noise and normalizes slang", () => {
    const result = normalizeUzbekText("Bugun story tashladim, zo'r bo'ldi!!! https://t.co/demo", "social");

    expect(result.cleanedText).toContain("bugun");
    expect(result.cleanedText).not.toContain("https");
    expect(result.normalizedText).toBeTruthy();
    expect(result.tokenCount).toBeGreaterThan(0);
  });

  it("supports formal preset", () => {
    const result = normalizeUzbekText("salom dunyo", "formal");

    expect(result.normalizedText.startsWith("Salom")).toBe(true);
  });
});
