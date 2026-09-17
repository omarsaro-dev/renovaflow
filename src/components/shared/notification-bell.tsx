"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/lib/utils";

interface SimpleNotification {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export function NotificationBell({ portal = "/app" }: { portal?: string }) {
  const [unread, setUnread] = React.useState(0);
  const [items, setItems] = React.useState<SimpleNotification[]>([]);
  const [open, setOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=8", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setItems(json.data.items ?? []);
      setUnread(json.data.unreadCount ?? 0);
    } catch {
      // silent
    }
  }, []);

  React.useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  async function markAllRead() {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      setItems((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
      setUnread(0);
    } catch {
      // silent
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative rounded-control border border-border bg-surface p-2 text-ink-muted transition-colors hover:bg-elevated hover:text-ink focus-visible:outline-2 focus-visible:outline-brand-light"
          aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
        >
          <Bell className="h-[18px] w-[18px]" aria-hidden />
          {unread > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white"
              aria-hidden
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(400px,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <DropdownMenuLabel className="px-0 pb-0 pt-0 text-[12px] font-semibold uppercase text-ink">
            Notifications
          </DropdownMenuLabel>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-brand hover:text-brand-hover"
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden />
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator className="my-0" />
        <div className="max-h-[380px] overflow-y-auto py-1">
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-ink-muted">
              You&apos;re all caught up.
            </p>
          ) : (
            items.map((n) => (
              <DropdownMenuItem key={n.id} asChild className="items-start rounded-none border-b border-border/60 px-4 py-3 last:border-0">
                <Link href={n.link ?? portal} onClick={() => setOpen(false)}>
                  <span className="mt-[3px] block h-1.5 w-1.5 shrink-0 rounded-full" aria-hidden>
                    {!n.readAt && <span className="block h-1.5 w-1.5 rounded-full bg-brand" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-[13px] leading-snug", !n.readAt ? "font-medium text-ink" : "text-ink-muted")}>
                      {n.title}
                    </span>
                    {n.body && <span className="mt-0.5 block text-[12px] leading-snug text-ink-faint">{n.body}</span>}
                    <span className="mt-0.5 block text-[11px] text-ink-faint">{relativeTime(n.createdAt)}</span>
                  </span>
                </Link>
              </DropdownMenuItem>
            ))
          )}
        </div>
        <DropdownMenuSeparator className="my-0" />
        <Link
          href={`${portal}/notifications`}
          onClick={() => setOpen(false)}
          className="block px-4 py-3 text-center text-[13px] font-medium text-brand hover:text-brand-hover"
        >
          View all notifications
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}