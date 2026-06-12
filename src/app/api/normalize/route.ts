import { NextResponse } from "next/server";

import { normalizeWithAI } from "@/lib/ai-normalizer";
import { normalizeSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = normalizeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Matn yoki preset noto'g'ri", issues: parsed.error.flatten() }, { status: 400 });
  }

  const result = await normalizeWithAI(parsed.data.text, parsed.data.preset);

  return NextResponse.json({
    result,
    message: process.env.OPENAI_API_KEY ? "Matn AI yordamida normallashtirildi" : "Matn lokal normalizer yordamida normallashtirildi",
  });
}
