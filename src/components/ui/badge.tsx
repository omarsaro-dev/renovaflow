import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "accent" | "brand";

const toneClasses: Record<Tone, { bg: string; text: string; dot: string }> = {
  neutral:  { bg: "bg-elevated text-ink-muted border-border", text: "text-ink-muted", dot: "bg-ink-muted" },
  info:     { bg: "bg-infoTint text-info border-info/20", text: "text-info", dot: "bg-info" },
  success:  { bg: "bg-successTint text-success border-success/20", text: "text-success", dot: "bg-success" },
  warning:  { bg: "bg-warningTint text-warning border-warning/20", text: "text-warning", dot: "bg-[#A17D1B]" },
  danger:   { bg: "bg-dangerTint text-danger border-danger/20", text: "text-danger", dot: "bg-danger" },
  accent:   { bg: "bg-accentTint text-[#7D5A23] border-accent/25", text: "text-[#7D5A23]", dot: "bg-accent" },
  brand:    { bg: "bg-brandTint text-brand border-brand/20", text: "text-brand", dot: "bg-brand" },
};

export function Badge({
  tone = "neutral",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  const t = toneClasses[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12px] font-medium leading-[1.5] tracking-[0.01em] select-none",
        t.bg,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function StatusDot({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  const t = toneClasses[tone];
  return (
    <span
      aria-hidden
      className={cn("inline-block h-1.5 w-1.5 shrink-0 rounded-full", t.dot, className)}
      {...props}
    />
  );
}

export function StatusBadge({
  tone = "neutral",
  icon: Icon,
  label,
  className,
}: {
  tone?: Tone;
  icon?: React.FC<{ className?: string }>;
  label: string;
  className?: string;
}) {
  return (
    <Badge tone={tone} className={className}>
      <StatusDot tone={tone} />
      {Icon && <Icon className="h-3.5 w-3.5 opacity-70" aria-hidden />}
      <span>{label}</span>
    </Badge>
  );
}

export function PriorityDot({ priority, className }: { priority: string; className?: string }) {
  const map: Record<string, Tone> = {
    LOW: "neutral",
    MEDIUM: "info",
    HIGH: "warning",
    URGENT: "danger",
  };
  return <StatusDot tone={map[priority] ?? "neutral"} className={className} />;
}