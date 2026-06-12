"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AuthMode = "login" | "register";

type Props = {
  mode: AuthMode;
};

export function AuthForm({ mode }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload =
      mode === "register"
        ? {
            name: String(formData.get("name") ?? "").trim(),
            email: String(formData.get("email") ?? "").trim(),
            password: String(formData.get("password") ?? ""),
          }
        : {
            email: String(formData.get("email") ?? "").trim(),
            password: String(formData.get("password") ?? ""),
          };

    const response = await fetch(mode === "register" ? "/api/auth/register" : "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setLoading(false);
      setError(data?.error ?? "So'rov bajarilmadi");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel mx-auto w-full max-w-md overflow-hidden rounded-[1.9rem] p-6 md:p-8">
      <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_right,rgba(198,95,52,0.16),transparent_55%)]" />
      <div className="relative space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted">
          {mode === "register" ? "Yangi akkaunt" : "Xush kelibsiz"}
        </p>
        <h1 className="font-display text-3xl text-foreground md:text-4xl">
          {mode === "register" ? "Ro'yxatdan o'tish" : "Kirish"}
        </h1>
        <p className="text-sm leading-6 text-muted">
          {mode === "register"
            ? "Matnlarni saqlash va tahlil qilish uchun akkaunt yarating."
            : "Qayta ishlangan matnlar va natijalarni ko'rish uchun kirish qiling."}
        </p>
      </div>

      <div className="relative mt-6 space-y-4">
        {mode === "register" ? (
          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">Ism</span>
            <input
              name="name"
              type="text"
              placeholder="Masalan, Aziza"
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-accent"
              required
            />
          </label>
        ) : null}

        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">Email</span>
          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-accent"
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">Parol</span>
          <input
            name="password"
            type="password"
            placeholder="Kamida 8 belgi"
            className="w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-accent"
            required
          />
        </label>
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition hover:bg-accent-strong hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Yuklanmoqda..." : mode === "register" ? "Akkaunt yaratish" : "Kirish"}
      </button>

      <p className="mt-4 text-center text-sm text-muted">
        {mode === "register" ? "Allaqachon akkauntingiz bormi? " : "Akkaunt yo'qmi? "}
        <a className="font-semibold text-accent-strong hover:underline" href={mode === "register" ? "/login" : "/register"}>
          {mode === "register" ? "Kirish" : "Ro'yxatdan o'tish"}
        </a>
      </p>
    </form>
  );
}
