"use client";

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { Loader2 } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export const ConfirmDialog = AlertDialogPrimitive.Root;
export const ConfirmDialogTrigger = AlertDialogPrimitive.Trigger;

export function ConfirmDialogContent({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  loading = false,
  onConfirm,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary" | "neutral";
  loading?: boolean;
  onConfirm: () => void;
  className?: string;
}) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#22291f]/40 backdrop-blur-[2px] data-[state=open]:animate-fade-in" />
      <AlertDialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-card border border-border bg-surface p-6 shadow-elevated data-[state=open]:animate-slide-up focus:outline-none",
          className
        )}
      >
        <AlertDialogPrimitive.Title className="text-[17px] font-semibold tracking-[-0.01em] text-ink">
          {title}
        </AlertDialogPrimitive.Title>
        {description && (
          <AlertDialogPrimitive.Description className="mt-2 text-[13px] leading-relaxed text-ink-muted">
            {description}
          </AlertDialogPrimitive.Description>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <AlertDialogPrimitive.Cancel asChild>
            <Button type="button" variant="outline">
              {cancelLabel}
            </Button>
          </AlertDialogPrimitive.Cancel>
          <AlertDialogPrimitive.Action asChild>
            <Button
              type="button"
              variant={tone === "danger" ? "danger" : tone === "primary" ? "primary" : "outline"}
              loading={loading}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </AlertDialogPrimitive.Action>
        </div>
      </AlertDialogPrimitive.Content>
    </AlertDialogPrimitive.Portal>
  );
}

export { Loader2 as _Loader2 };