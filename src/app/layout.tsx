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
        <footer className="mt-auto border-t border-border/40 bg-white/40 py-6 backdrop-blur-sm">
          <div className="section-shell flex flex-col items-center justify-between gap-3 text-center text-sm text-muted md:flex-row md:text-left">
            <p>© {new Date().getFullYear()} Uzbek Text Normalizer. Bachelor thesis project.</p>
            <p>Automatic cleaning & normalization for Uzbek social media text.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
