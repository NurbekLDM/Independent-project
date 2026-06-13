
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { ratingSchema } from "@/lib/validators";

type SlangItem = { original: string; replacement: string };

function parseSlangMap(value: unknown): SlangItem[] {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as SlangItem[];
    } catch {
      return [];
    }
  }
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is SlangItem =>
        typeof item === "object" && item !== null && "original" in item && "replacement" in item,
    );
  }
  return [];
}

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await query<{
    id: string;
    original_text: string;
    cleaned_text: string;
    normalized_text: string;
    slang_map: string;
    token_count: number;
    language_confidence: number;
    rating: number | null;
    created_at: string;
  }>(
    "SELECT id, original_text, cleaned_text, normalized_text, slang_map, token_count, language_confidence, rating, created_at FROM saved_texts WHERE user_id = $1 ORDER BY created_at DESC",
    [user.id],
  );

  return NextResponse.json({
    savedTexts: rows.map((row) => ({
      id: row.id,
      originalText: row.original_text,
      cleanedText: row.cleaned_text,
      normalizedText: row.normalized_text,
      slangMap: parseSlangMap(row.slang_map),
      tokenCount: row.token_count,
      languageConfidence: row.language_confidence,
      rating: row.rating,
      createdAt: row.created_at,
    })),
  });
}

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body?.result) {
    return NextResponse.json({ error: "Result topilmadi" }, { status: 400 });
  }

  const row = await queryOne<{
    id: string;
    original_text: string;
    cleaned_text: string;
    normalized_text: string;
    slang_map: string;
    token_count: number;
    language_confidence: number;
    rating: number | null;
    created_at: string;
  }>(
    `INSERT INTO saved_texts (user_id, original_text, cleaned_text, normalized_text, slang_map, token_count, language_confidence)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, original_text, cleaned_text, normalized_text, slang_map, token_count, language_confidence, rating, created_at`,
    [
      user.id,
      body.result.originalText,
      body.result.cleanedText,
      body.result.normalizedText,
      JSON.stringify(body.result.slangMap ?? []),
      Number(body.result.tokenCount) || 0,
      Number(body.result.languageConfidence) || 0,
    ],
  );

  if (!row) {
    return NextResponse.json({ error: "Saqlashda xatolik" }, { status: 500 });
  }

  return NextResponse.json({
    savedText: {
      id: row.id,
      originalText: row.original_text,
      cleanedText: row.cleaned_text,
      normalizedText: row.normalized_text,
      slangMap: parseSlangMap(row.slang_map),
      tokenCount: row.token_count,
      languageConfidence: row.language_confidence,
      rating: row.rating,
      createdAt: row.created_at,
    },
  }, { status: 201 });
}