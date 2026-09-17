import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format, isAfter, isBefore, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(amount: number, opts?: { compact?: boolean }) {
  const value = Math.round(amount * 100) / 100;
  if (opts?.compact && Math.abs(value) >= 100000) {
    return `$${(value / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })}k`;
  }
  if (opts?.compact && Math.abs(value) >= 1000000) {
    return `$${(value / 1000000).toLocaleString("en-US", { maximumFractionDigits: 2 })}M`;
  }
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Math.abs(value) >= 1000 ? 0 : 2,
    maximumFractionDigits: Math.abs(value) >= 1000 ? 0 : 2,
  });
}

export function formatSignedMoney(amount: number) {
  const sign = amount > 0 ? "+" : amount < 0 ? "−" : "";
  const abs = Math.abs(amount);
  const body = abs.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}${body}`;
}

export function formatDate(date: Date | string | null | undefined, pattern = "MMM d, yyyy") {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (isNaN(d.getTime())) return "—";
  return format(d, pattern);
}

export function formatShortDate(date: Date | string | null | undefined) {
  return formatDate(date, "MMM d");
}

export function relativeTime(date: Date | string | null | undefined) {
  if (!date) return "";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (isNaN(d.getTime())) return "";
  return formatDistanceToNow(d, { addSuffix: true });
}

export function isOverdue(date: Date | string | null | undefined) {
  if (!date) return false;
  const d = typeof date === "string" ? parseISO(date) : date;
  return isBefore(d, new Date());
}

export function isUpcoming(date: Date | string | null | undefined, withinDays: number) {
  if (!date) return false;
  const d = typeof date === "string" ? parseISO(date) : date;
  const window = new Date();
  window.setDate(window.getDate() + withinDays);
  return isAfter(d, new Date()) && isBefore(d, window);
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function percentUsed(spent: number, budget: number) {
  if (!budget) return 0;
  return clamp(Math.round((spent / budget) * 100), 0, 200);
}

export function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function truncate(str: string, length: number) {
  return str.length > length ? `${str.slice(0, length - 1)}…` : str;
}

export function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}