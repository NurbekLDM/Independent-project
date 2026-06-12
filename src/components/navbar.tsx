"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  userName?: string | null;
  onLogout?: () => void;
};

export function Navbar({ userName, onLogout }: Props) {
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";

  return (
    <nav className="sticky top-0 z-40 border-b border-border/60 bg-white/70 backdrop-blur-xl">
      <div className="section-shell flex h-16 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 transition hover:opacity-80"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-white shadow-md shadow-accent/20">
            U
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-foreground">
            Uzbek Normalizer
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              !isDashboard
                ? "bg-foreground text-white"
                : "text-muted hover:bg-border/50 hover:text-foreground"
            }`}
          >
            Home
          </Link>

          {userName ? (
            <>
              <Link
                href="/dashboard"
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  isDashboard
                    ? "bg-foreground text-white"
                    : "text-muted hover:bg-border/50 hover:text-foreground"
                }`}
              >
                Dashboard
              </Link>

              <span className="hidden text-sm text-muted sm:inline">•</span>

              <span className="hidden text-sm font-medium text-foreground sm:inline">
                {userName}
              </span>

              {onLogout ? (
                <button
                  type="button"
                  onClick={onLogout}
                  className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent-strong"
                >
                  Chiqish
                </button>
              ) : null}
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-sm font-medium text-muted transition hover:bg-border/50 hover:text-foreground"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white shadow-md shadow-accent/20 transition hover:bg-accent-strong"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
