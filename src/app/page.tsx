import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { ThemeToggle } from "@/components/theme-toggle";

const pillars = [
  {
    title: "Matnni tozalash",
    description: "URL, mention, hashtag, ortiqcha belgilar va noise elementlar olib tashlanadi.",
  },
  {
    title: "Normalizatsiya",
    description: "Slang, qisqartma va yozilishdagi og'ishlar standart shaklga keltiriladi.",
  },
  {
    title: "Saqlash va tahlil",
    description: "Qayta ishlangan matnlar saqlanadi, reyting va keyingi tahlil uchun tayyor bo'ladi.",
  },
];

const roadmap = [
  "Muammoni aniqlash va research question",
  "WBS, Gantt va risk planning",
  "Next.js + PostgreSQL + Prisma MVP",
  "Test, user validation va yakuniy baholash",
];

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="section-shell py-8 md:py-10">
        <section className="glass-panel relative overflow-hidden rounded-[2rem] px-6 py-8 md:px-10 md:py-12">
          <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(198,95,52,0.18),transparent_55%),radial-gradient(circle_at_top_right,rgba(53,95,75,0.12),transparent_40%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              <span className="inline-flex rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-medium text-emerald shadow-sm">
                Uzbek Text Normalizer MVP
              </span>
              <div className="space-y-4">
                <h1 className="max-w-3xl font-display text-4xl leading-none tracking-tight text-foreground md:text-6xl">
                  Social media matnlarini avtomatik tozalash va normalizatsiya qilish servisi.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-muted md:text-lg">
                  Bu MVP uzbekcha post, comment va chat matnlaridagi shovqinni kamaytiradi, standart shaklga keltiradi
                  va keyingi NLP pipeline'lar uchun tayyorlaydi.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition hover:bg-accent-strong"
                >
                  Register
                </Link>
                <Link href="/dashboard" className="inline-flex items-center justify-center rounded-full border border-border bg-white/80 px-6 py-3 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent-strong">
                  Dashboard
                </Link>
              </div>
            </div>

            <div className="grid gap-4 rounded-[1.75rem] border border-border bg-[#fffdf9] p-5 shadow-xl shadow-black/5">
              <div className="rounded-[1.5rem] bg-foreground p-5 text-white shadow-lg shadow-black/15">
                <p className="text-sm uppercase tracking-[0.28em] text-white/70">Research question</p>
                <p className="mt-3 text-2xl font-display leading-tight md:text-[2.15rem]">
                  How can automatic text cleaning and normalization improve the quality of Uzbek social media text for downstream NLP tasks?
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {pillars.map((pillar) => (
                  <article key={pillar.title} className="rounded-[1.2rem] border border-border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <h2 className="text-sm font-semibold text-foreground">{pillar.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-muted">{pillar.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="glass-panel rounded-[1.5rem] p-5 transition hover:-translate-y-1 hover:shadow-xl">
            <p className="text-sm font-semibold text-emerald">MVP scope</p>
            <p className="mt-2 text-2xl font-display">Login, text normalize, save, rate</p>
          </article>
          <article className="glass-panel rounded-[1.5rem] p-5 transition hover:-translate-y-1 hover:shadow-xl">
            <p className="text-sm font-semibold text-emerald">Stack</p>
            <p className="mt-2 text-2xl font-display">Next.js + Prisma + PostgreSQL + Docker</p>
          </article>
          <article className="glass-panel rounded-[1.5rem] p-5 transition hover:-translate-y-1 hover:shadow-xl">
            <p className="text-sm font-semibold text-emerald">Validation</p>
            <p className="mt-2 text-2xl font-display">Normalization engine test bilan tekshiriladi</p>
          </article>
          <article className="glass-panel rounded-[1.5rem] p-5 transition hover:-translate-y-1 hover:shadow-xl">
            <p className="text-sm font-semibold text-emerald">Evaluation</p>
            <p className="mt-2 text-2xl font-display">User test va natija tahlili uchun tayyor</p>
          </article>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="glass-panel rounded-[1.75rem] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted">Project plan</p>
            <h2 className="mt-3 font-display text-3xl leading-tight">Loyiha talablari shu yerda yopiladi</h2>
            <p className="mt-3 text-sm leading-7 text-muted">
              Dastur real muammoni hal qiladi, rejalashtiriladi, ishlab chiqiladi, testlanadi va natijasi baholanadi.
            </p>
          </div>
          <div className="glass-panel rounded-[1.75rem] p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-2xl">MVP bosqichlari</h2>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <Link href="/login" className="text-sm font-semibold text-accent-strong hover:underline">
                  Login
                </Link>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              {roadmap.map((item, index) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent-strong">
                    0{index + 1}
                  </div>
                  <p className="text-sm leading-6 text-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
