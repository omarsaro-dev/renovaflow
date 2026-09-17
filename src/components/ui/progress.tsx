import * as React from "react";
import { cn } from "@/lib/utils";

export function Progress({
  value = 0,
  size = "md",
  showLabel = false,
  tone = "brand",
  className,
}: {
  value?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  tone?: "brand" | "success" | "warning" | "danger";
  className?: string;
}) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const h = size === "sm" ? "h-1.5" : size === "lg" ? "h-3.5" : "h-2.5";
  const fillClass =
    tone === "success" ? "bg-success"
    : tone === "warning" ? "bg-[#C99A37]"
    : tone === "danger" ? "bg-danger"
    : "bg-brand";

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[13px] text-ink-muted">Progress</span>
          <span className="text-[13px] font-medium tabular-nums text-ink">{v}%</span>
        </div>
      )}
      <div className={cn("w-full overflow-hidden rounded-full bg-border", h)} role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={`Progress: ${v}%`}>
        <div
          className={cn("rounded-full transition-all duration-500 ease-out", h, v >= 100 ? "bg-success" : fillClass)}
          style={{ width: `${v}%` }}
        />
      </div>
    </div>
  );
}