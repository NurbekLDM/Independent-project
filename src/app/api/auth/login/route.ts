import { NextResponse } from "next/server";

import { loginAccount } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Kirish ma'lumotlari noto'g'ri", issues: parsed.error.flatten() }, { status: 400 });
  }

  return loginAccount(parsed.data.email, parsed.data.password);
}
