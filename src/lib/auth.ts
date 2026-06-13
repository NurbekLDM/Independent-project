import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { queryOne } from "@/lib/db";
import { clearSessionCookie, getSessionUserId, setSessionCookie } from "@/lib/session";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function registerAccount(name: string, email: string, password: string) {
  const existingUser = await queryOne<{ id: string }>(
    "SELECT id FROM users WHERE email = $1",
    [email],
  );

  if (existingUser) {
    return NextResponse.json({ error: "Bu email allaqachon ro'yxatdan o'tgan" }, { status: 409 });
  }

  const user = await queryOne<{ id: string; name: string; email: string }>(
    "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email",
    [name, email, await hashPassword(password)],
  );

  if (!user) {
    return NextResponse.json({ error: "Akkaunt yaratilmadi" }, { status: 500 });
  }

  await setSessionCookie(user.id);

  return NextResponse.json({ user }, { status: 201 });
}

export async function loginAccount(email: string, password: string) {
  const user = await queryOne<{
    id: string;
    name: string;
    email: string;
    password_hash: string;
  }>(
    "SELECT id, name, email, password_hash FROM users WHERE email = $1",
    [email],
  );

  if (!user) {
    return NextResponse.json({ error: "Email yoki parol noto'g'ri" }, { status: 401 });
  }

  const isValid = await comparePassword(password, user.password_hash);

  if (!isValid) {
    return NextResponse.json({ error: "Email yoki parol noto'g'ri" }, { status: 401 });
  }

  await setSessionCookie(user.id);

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
}

export async function logoutAccount() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}

export async function getSessionUser() {
  const userId = await getSessionUserId();

  if (!userId) {
    return null;
  }

  return queryOne<{ id: string; name: string; email: string }>(
    "SELECT id, name, email FROM users WHERE id = $1",
    [userId],
  );
}