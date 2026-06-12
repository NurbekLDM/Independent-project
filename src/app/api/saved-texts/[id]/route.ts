import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ratingSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = ratingSchema.safeParse({ rating: Number(body?.rating) });

  if (!parsed.success) {
    return NextResponse.json({ error: "Rating noto'g'ri" }, { status: 400 });
  }

  const { id } = await context.params;

  const updated = await prisma.normalizedText.updateMany({
    where: {
      id,
      userId: user.id,
    },
    data: {
      rating: parsed.data.rating,
    },
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: "Matn topilmadi" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
