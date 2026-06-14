import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";
import "./globals.css";

const displayFont = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const bodyFont = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Uzbek Text Normalizer",
  description: "Automatic cleaning and normalization of Uzbek social media text.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" className={`${displayFont.variable} ${bodyFont.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <footer className="mt-auto border-t border-border/40 bg-white/40 py-8 backdrop-blur-sm">
          <div className="section-shell">
            <div className="grid gap-6 text-center text-sm text-muted md:grid-cols-3 md:text-left">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/70">Student</p>
                <p className="font-medium text-foreground">Noryigitova Gozal</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/70">Supervisor</p>
                <p className="font-medium text-foreground">Uzoqov Lochinbek</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/70">Topic</p>
                <p className="font-medium text-foreground leading-5">
                  Development of a Web service for automatic cleaning and Normalization of uzbek language texts collected from social media platforms
                </p>
              </div>
            </div>
            <div className="mt-6 border-t border-border/30 pt-4 text-center text-xs text-muted">
              <p>© {new Date().getFullYear()} — Bachelor Thesis Project</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
