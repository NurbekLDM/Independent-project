import { NextResponse } from "next/server";

import { registerAccount } from "@/lib/auth";
import { authSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = authSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Kirish ma'lumotlari noto'g'ri", issues: parsed.error.flatten() }, { status: 400 });
  }

  return registerAccount(parsed.data.name, parsed.data.email, parsed.data.password);
}
