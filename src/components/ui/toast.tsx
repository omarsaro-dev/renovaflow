"use client";

import * as React from "react";
import { create } from "zustand";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";
interface Toast {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastStore {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
}

let toastId = 0;

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  push: (t) => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 4500);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export function toast(title: string, description?: string) {
  useToast.getState().push({ title, description, tone: "success" });
}

export function toastError(title: string, description?: string) {
  useToast.getState().push({ title, description, tone: "error" });
}

export function toastInfo(title: string, description?: string) {
  useToast.getState().push({ title, description, tone: "info" });
}

const toneIcon: Record<ToastTone, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

export function Toaster({ className }: { className?: string }) {
  const toasts = useToast((s) => s.toasts);
  const dismiss = useToast((s) => s.dismiss);

  return (
    <div className={cn("pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2", className)}>
      {toasts.map((t) => {
        const Icon = toneIcon[t.tone];
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-card border bg-surface p-4 shadow-elevated animate-slide-up",
              t.tone === "success" && "border-success/25",
              t.tone === "error" && "border-danger/25",
              t.tone === "info" && "border-info/25"
            )}
          >
            <Icon
              className={cn(
                "mt-0.5 h-4.5 w-4.5 shrink-0",
                t.tone === "success" && "text-success",
                t.tone === "error" && "text-danger",
                t.tone === "info" && "text-info"
              )}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">{t.title}</p>
              {t.description && <p className="mt-0.5 text-[13px] leading-relaxed text-ink-muted">{t.description}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded p-1 text-ink-faint transition-colors hover:bg-elevated hover:text-ink"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}