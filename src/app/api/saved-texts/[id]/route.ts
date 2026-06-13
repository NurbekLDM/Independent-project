import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { execute } from "@/lib/db";
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

  const result = await execute(
    "UPDATE saved_texts SET rating = $1 WHERE id = $2 AND user_id = $3",
    [parsed.data.rating, id, user.id],
  );

  if (result.rowCount === 0) {
    return NextResponse.json({ error: "Matn topilmadi" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}