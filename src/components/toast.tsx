"use client";

import { useEffect } from "react";
import type { ToastMessage } from "@/lib/types";

type Props = {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
};

const icons: Record<ToastMessage["type"], string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
};

export function ToastContainer({ toasts, removeToast }: Props) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: ToastMessage; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const borderColor =
    toast.type === "success"
      ? "border-emerald/30 bg-emerald/10"
      : toast.type === "error"
        ? "border-red-300 bg-red-50"
        : "border-accent/20 bg-accent-soft/60";

  const iconColor =
    toast.type === "success"
      ? "text-emerald"
      : toast.type === "error"
        ? "text-red-600"
        : "text-accent-strong";

  return (
    <div
      className={`animate-slide-in flex items-start gap-3 rounded-2xl border px-5 py-4 shadow-xl backdrop-blur-md ${borderColor}`}
      style={{
        animation: "slideIn 0.3s ease-out",
        minWidth: "280px",
        maxWidth: "420px",
      }}
    >
      <span className={`mt-0.5 text-lg font-bold ${iconColor}`}>{icons[toast.type]}</span>
      <p className="flex-1 text-sm leading-5 text-foreground">{toast.text}</p>
      <button
        type="button"
        onClick={onClose}
        className="ml-2 text-muted transition hover:text-foreground"
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
}
