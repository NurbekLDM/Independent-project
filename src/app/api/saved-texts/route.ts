import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ratingSchema } from "@/lib/validators";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const savedTexts = await prisma.normalizedText.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    savedTexts: savedTexts.map((text) => ({
      ...text,
      slangMap: text.slangMap as Array<{ original: string; replacement: string }>,
      createdAt: text.createdAt.toISOString(),
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

  const savedText = await prisma.normalizedText.create({
    data: {
      userId: user.id,
      originalText: body.result.originalText,
      cleanedText: body.result.cleanedText,
      normalizedText: body.result.normalizedText,
      slangMap: body.result.slangMap,
      tokenCount: Number(body.result.tokenCount) || 0,
      languageConfidence: Number(body.result.languageConfidence) || 0,
      rating: null,
    },
  });

  return NextResponse.json({
    savedText: {
      ...savedText,
      slangMap: savedText.slangMap as Array<{ original: string; replacement: string }>,
      createdAt: savedText.createdAt.toISOString(),
    },
  }, { status: 201 });
}
