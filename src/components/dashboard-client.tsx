"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { AuthUser, NormalizationPreset, NormalizationResult, SavedTextRecord, ToastMessage } from "@/lib/types";
import { normalizeUzbekText } from "@/lib/text-normalizer";
import { fileToText } from "@/lib/file-import";
import { StarRating } from "@/components/star-rating";
import { ToastContainer } from "@/components/toast";
import { Navbar } from "@/components/navbar";
import { ThemeToggle } from "@/components/theme-toggle";

const presets: NormalizationPreset[] = ["social", "formal", "search"];

function toTextArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function addToast(
  setToasts: React.Dispatch<React.SetStateAction<ToastMessage[]>>,
  type: ToastMessage["type"],
  text: string,
) {
  const id = crypto.randomUUID();
  setToasts((prev) => [...prev, { id, type, text }]);
}

function removeToastById(
  setToasts: React.Dispatch<React.SetStateAction<ToastMessage[]>>,
  id: string,
) {
  setToasts((prev) => prev.filter((t) => t.id !== id));
}

// --- Skeleton loader ---
function DashboardSkeleton() {
  return (
    <div className="section-shell py-8 md:py-10">
      <div className="glass-panel rounded-[2rem] p-6 md:p-8">
        <div className="h-8 w-64 skeleton mb-4" />
        <div className="h-5 w-96 skeleton mb-6" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 skeleton" />
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="h-96 skeleton" />
          <div className="h-96 skeleton" />
        </div>
      </div>
    </div>
  );
}

export function DashboardClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("Bugun story tashladim, zo'r bo'ldi!!! https://t.co/demo");
  const [preset, setPreset] = useState<NormalizationPreset>("social");
  const [result, setResult] = useState<NormalizationResult | null>(null);
  const [savedItems, setSavedItems] = useState<SavedTextRecord[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"text" | "file">("text");
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const notify = useCallback(
    (type: ToastMessage["type"], text: string) => addToast(setToasts, type, text),
    [],
  );
  const dismissToast = useCallback((id: string) => removeToastById(setToasts, id), []);

  // --- Load data ---
  async function loadData() {
    setLoading(true);
    const [meResponse, savedResponse] = await Promise.all([fetch("/api/me"), fetch("/api/saved-texts")]);

    if (meResponse.ok) {
      const meData = (await meResponse.json()) as { user: AuthUser };
      setUser(meData.user);
    } else {
      setUser(null);
    }

    if (savedResponse.ok) {
      const savedData = (await savedResponse.json()) as { savedTexts: SavedTextRecord[] };
      setSavedItems(savedData.savedTexts);
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function processFiles(files: File[]) {
    setBusy(true);
    setMessage(null);

    const allowedTypes = [".txt", ".md", ".json", ".csv"];
    const allowedMimes = [
      "text/plain",
      "text/markdown",
      "application/json",
      "text/csv",
      "application/vnd.ms-excel",
    ];

    const validFiles = files.filter((f) => {
      const ext = "." + f.name.split(".").pop()?.toLowerCase();
      return allowedTypes.includes(ext) || allowedMimes.includes(f.type);
    });

    if (validFiles.length === 0) {
      notify("error", "Faqat .txt, .md, .json yoki .csv fayllar qabul qilinadi");
      setBusy(false);
      return;
    }

    const combined: string[] = [];

    for (const file of validFiles) {
      if (file.size > 5 * 1024 * 1024) {
        notify("error", `${file.name} - fayl hajmi 5MB dan oshmasligi kerak`);
        continue;
      }

      const fileText = await file.text();
      const importedText = fileToText(file.name, fileText, preset);
      combined.push(importedText);
    }

    if (combined.length > 0) {
      const joined = combined.join("\n\n---\n\n");
      setText(joined);
      setSelectedFileName(validFiles.map((f) => f.name).join(", "));
      setActiveTab("text");
      setMessage(`${validFiles.length} ta fayl yuklandi`);
      notify("success", `${validFiles.length} ta fayl muvaffaqiyatli yuklandi`);
    }

    setBusy(false);
  }

  // --- Drag & drop handlers ---
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      await processFiles(files);
    },
    [preset, processFiles],
  );

  async function handleNormalize(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    const normalized = normalizeUzbekText(text, preset);
    setResult(normalized);

    try {
      const response = await fetch("/api/normalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, preset }),
      });

      const data = (await response.json().catch(() => null)) as
        | { result?: NormalizationResult; message?: string; error?: string }
        | null;

      if (!response.ok) {
        setMessage(data?.error ?? "Matnni normallashtirib bo'lmadi");
        setBusy(false);
        return;
      }

      setResult(data?.result ?? normalized);
      setMessage(data?.message ?? "Matn normallashtirildi");
      notify("success", "Matn muvaffaqiyatli normallashtirildi");
    } catch {
      setMessage("Server bilan bog'lanib bo'lmadi, lokal normalizer ishlatildi");
      setResult(normalized);
      notify("info", "Lokal normalizer ishlatildi");
    }

    setBusy(false);
  }

  async function handleSave() {
    if (!result) return;

    setBusy(true);

    try {
      const response = await fetch("/api/saved-texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result }),
      });

      if (response.ok) {
        setMessage("Natija saqlandi");
        notify("success", "Natija database'ga saqlandi");
        await loadData();
      } else {
        setMessage("Saqlashda xatolik yuz berdi");
        notify("error", "Saqlashda xatolik yuz berdi");
      }
    } catch {
      setMessage("Saqlashda xatolik yuz berdi");
      notify("error", "Server bilan bog'lanib bo'lmadi");
    }

    setBusy(false);
  }

  async function handleRate(textId: string, rating: number) {
    const response = await fetch(`/api/saved-texts/${textId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating }),
    });

    if (response.ok) {
      setSavedItems((current) =>
        current.map((item) => (item.id === textId ? { ...item, rating } : item)),
      );
      notify("success", "Reyting saqlandi");
    } else {
      notify("error", "Reytingni saqlab bo'lmadi");
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      notify("error", "Fayl hajmi 5MB dan oshmasligi kerak");
      return;
    }

    setBusy(true);
    setMessage(null);

    const fileText = await file.text();
    const importedText = fileToText(file.name, fileText, preset);
    setText(importedText);
    setSelectedFileName(file.name);
    setActiveTab("text");
    setMessage(`Fayl yuklandi: ${file.name}`);
    notify("success", `"${file.name}" yuklandi`);
    setBusy(false);
  }

  const stats = useMemo(
    () => [
      { label: "Saqlangan matnlar", value: savedItems.length.toString(), hint: "Database'da" },
      { label: "Preset", value: preset, hint: "Joriy rejim" },
      { label: "Belgilar", value: text.length.toString(), hint: "Kiritilgan matn" },
    ],
    [preset, savedItems.length, text.length],
  );

  const charPercent = Math.min(100, (text.length / 2000) * 100);
  const charColor =
    charPercent > 90 ? "text-red-500" : charPercent > 70 ? "text-amber-500" : "text-emerald";

  if (loading) {
    return (
      <>
        <Navbar />
        <DashboardSkeleton />
        <ToastContainer toasts={toasts} removeToast={dismissToast} />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="section-shell py-10">
          <div className="glass-panel rounded-[1.75rem] p-8 text-center">
            <h1 className="font-display text-3xl text-foreground">Kirish talab qilinadi</h1>
            <p className="mt-3 text-sm leading-6 text-muted">
              Matn normalizatsiyasi, saqlash va reyting funksiyalari uchun avval login qiling.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="/login"
                className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white"
              >
                Login
              </a>
              <a
                href="/register"
                className="rounded-full border border-border bg-white px-5 py-3 text-sm font-semibold text-foreground"
              >
                Ro'yxatdan o'tish
              </a>
            </div>
          </div>
        </div>
        <ToastContainer toasts={toasts} removeToast={dismissToast} />
      </>
    );
  }

  return (
    <>
      <Navbar userName={user.name} onLogout={handleLogout} />
      <main className="section-shell py-8 md:py-10">
        <section className="glass-panel relative overflow-hidden rounded-[2rem] p-6 md:p-8">
          <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(198,95,52,0.18),transparent_55%),radial-gradient(circle_at_top_right,rgba(53,95,75,0.12),transparent_40%)]" />
          <div className="relative flex flex-col gap-4 border-b border-border/80 pb-6 md:flex-row md:items-end md:justify-between">
            <div className="animate-fade-in">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted">
                Normalization workspace
              </p>
              <h1 className="mt-2 font-display text-4xl text-foreground md:text-5xl">
                Xush kelibsiz, {user.name}.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
                Matnni kiriting yoki fayl yuklang. Tizim uni AI yordamida tozalaydi, normalizatsiya
                qiladi va keyinchalik saqlash yoki baholashga tayyorlaydi.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <span className="rounded-full border border-border bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                AI + Upload
              </span>
            </div>
          </div>

          <div className="relative mt-6 grid gap-4 md:grid-cols-3">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className="animate-fade-in rounded-[1.35rem] border border-border bg-white/85 p-4 shadow-sm"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  {stat.label}
                </p>
                <p className="mt-2 font-display text-2xl text-foreground">{stat.value}</p>
                <p className="mt-1 text-sm text-muted">{stat.hint}</p>
              </div>
            ))}
          </div>

          <div className="relative mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <form
              onSubmit={handleNormalize}
              className="rounded-[1.75rem] border border-border bg-white p-5 shadow-sm md:p-6"
            >
              <div className="space-y-3">
                <div className="inline-flex rounded-full bg-accent-soft px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-accent-strong">
                  Input studio
                </div>
                <h2 className="font-display text-2xl text-foreground md:text-3xl">
                  Matn yoki faylni tayyorlang
                </h2>
                <p className="text-sm leading-6 text-muted">
                  Social media post, comment, JSON eksport yoki oddiy .txt faylni yuklab, bir zumda
                  normallashtiring.
                </p>
              </div>

              <div className="mt-5 inline-flex rounded-full border border-border bg-[#fffaf4] p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("text")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeTab === "text"
                      ? "bg-foreground text-white"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Text input
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("file")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeTab === "file"
                      ? "bg-foreground text-white"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  File upload
                </button>
              </div>

              {activeTab === "file" ? (
                <div
                  ref={dropZoneRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`mt-5 rounded-[1.35rem] border-2 border-dashed p-5 transition ${
                    dragOver
                      ? "border-accent bg-accent-soft/30"
                      : "border-border bg-[#fffdf9]"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Fayl yuklash</p>
                      <p className="mt-1 text-sm leading-6 text-muted">
                        .txt, .md, .json yoki .csv faylni yuklang yoki tashlang. Matn avtomatik
                        import qilinadi.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center justify-center rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-strong"
                    >
                      Fayl tanlash
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md,.json,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="mt-4 rounded-2xl border border-border bg-white px-4 py-3 text-sm text-muted">
                    {selectedFileName
                      ? `Tanlangan fayl(lar): ${selectedFileName}`
                      : "Hali fayl tanlanmagan — yoki sichqoncha bilan tashlang"}
                  </div>
                  {dragOver ? (
                    <div className="mt-3 text-center text-sm font-semibold text-accent-strong">
                      Faylni tashlang!
                    </div>
                  ) : null}
                </div>
              ) : null}

              <label className="mt-5 block space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Matn</span>
                  <span className={`text-xs font-medium ${charColor}`}>
                    {text.length} / 2000
                  </span>
                </div>
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  rows={8}
                  maxLength={5000}
                  placeholder="Masalan: bugun shunaqa kontent chiqdi, zo'r bo'ldi!!!"
                  className="w-full rounded-[1.35rem] border border-border bg-[#fffdf9] px-4 py-3 outline-none transition focus:border-accent"
                />
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/40">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      charPercent > 90
                        ? "bg-red-400"
                        : charPercent > 70
                          ? "bg-amber-400"
                          : "bg-emerald"
                    }`}
                    style={{ width: `${charPercent}%` }}
                  />
                </div>
              </label>

              <div className="mt-4 grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-foreground">Preset</span>
                  <select
                    value={preset}
                    onChange={(event) => setPreset(event.target.value as NormalizationPreset)}
                    className="w-full rounded-2xl border border-border bg-[#fffdf9] px-4 py-3 outline-none transition focus:border-accent"
                  >
                    {presets.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="rounded-2xl border border-border bg-[#fffdf9] p-4">
                  <p className="text-sm font-semibold text-foreground">Nima qiladi?</p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    URL, mention, emoji shovqini, ortiqcha takrorlar va slangni bitta oqimda
                    tozalaydi.
                  </p>
                </div>
              </div>

              {message ? (
                <p className="mt-4 animate-fade-in rounded-2xl border border-emerald/20 bg-emerald/10 px-4 py-3 text-sm text-emerald">
                  {message}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={busy}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
              >
                {busy ? (
                  <>
                    <span className="flex gap-1">
                      <span
                        className="inline-block h-2 w-2 animate-[pulse-dot_1.4s_ease-in-out_infinite] rounded-full bg-white"
                        style={{ animationDelay: "0s" }}
                      />
                      <span
                        className="inline-block h-2 w-2 animate-[pulse-dot_1.4s_ease-in-out_infinite] rounded-full bg-white"
                        style={{ animationDelay: "0.2s" }}
                      />
                      <span
                        className="inline-block h-2 w-2 animate-[pulse-dot_1.4s_ease-in-out_infinite] rounded-full bg-white"
                        style={{ animationDelay: "0.4s" }}
                      />
                    </span>
                    Normallashtirilmoqda...
                  </>
                ) : (
                  "AI bilan normallashtirish"
                )}
              </button>
            </form>

            <section className="rounded-[1.75rem] border border-border bg-[#fffdf9] p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                    Result preview
                  </p>
                  <h2 className="mt-2 font-display text-2xl text-foreground">Tahlil oynasi</h2>
                </div>
                <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-strong">
                  {result ? `${Math.round(result.languageConfidence * 100)}%` : "-"} confidence
                </span>
              </div>

              {result ? (
                <div className="mt-4 animate-fade-in space-y-4">
                  <div className="rounded-[1.35rem] bg-foreground p-5 text-white shadow-lg shadow-black/10">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/65">
                      normalized
                    </p>
                    <p className="mt-2 text-lg leading-7 text-white/90">
                      {result.normalizedText}
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-white p-4">
                      <p className="text-sm font-semibold text-foreground">Cleaned text</p>
                      <p className="mt-2 text-sm leading-6 text-muted">{result.cleanedText}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-white p-4">
                      <p className="text-sm font-semibold text-foreground">Source text</p>
                      <p className="mt-2 line-clamp-6 text-sm leading-6 text-muted">{text}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-white p-4">
                      <p className="text-sm font-semibold text-foreground">Token count</p>
                      <p className="mt-2 text-sm leading-6 text-muted">{result.tokenCount}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-white p-4">
                      <p className="text-sm font-semibold text-foreground">Preset</p>
                      <p className="mt-2 text-sm leading-6 text-muted">{result.preset}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-white p-4">
                    <p className="text-sm font-semibold text-foreground">Slang mapping</p>
                    <p className="mt-3 text-sm leading-6 text-muted">
                      {result.slangMap.length > 0
                        ? result.slangMap
                            .map((item) => `${item.original} → ${item.replacement}`)
                            .join(", ")
                        : "Slang mapping topilmadi"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={busy}
                    className="inline-flex w-full items-center justify-center rounded-full border border-border bg-white px-5 py-3 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Natijani saqlash
                  </button>
                </div>
              ) : (
                <div className="mt-4 animate-fade-in rounded-[1.35rem] border border-dashed border-border bg-white p-8 text-center text-sm leading-6 text-muted">
                  Matn kiriting yoki fayl yuklang, keyin natija shu yerda ko'rsatiladi.
                </div>
              )}
            </section>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {savedItems.map((item, index) => (
            <article
              key={item.id}
              className="animate-fade-in glass-panel rounded-[1.5rem] p-5"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-emerald">Saved text</p>
                  <h3 className="mt-1 font-display text-2xl text-foreground">
                    {item.tokenCount} token
                  </h3>
                </div>
                <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-strong">
                  {Math.round(item.languageConfidence * 100)}%
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted">{item.normalizedText}</p>
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  Reyting
                </p>
                <StarRating
                  value={item.rating}
                  onChange={(rating) => void handleRate(item.id, rating)}
                />
              </div>
              <p className="mt-4 text-xs uppercase tracking-[0.22em] text-muted">
                {toTextArray(item.slangMap).join(", ") || "Slang mapping yo'q"}
              </p>
            </article>
          ))}

          {!savedItems.length ? (
            <div className="animate-fade-in glass-panel rounded-[1.5rem] p-6 text-sm leading-6 text-muted md:col-span-2 xl:col-span-3">
              Hali saqlangan matn yo'q. Normallashtirilgan matnni saqlash tugmasi orqali
              qo'shishingiz mumkin.
            </div>
          ) : null}
        </section>
      </main>
      <ToastContainer toasts={toasts} removeToast={dismissToast} />
    </>
  );
}
