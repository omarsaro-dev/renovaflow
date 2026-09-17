"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { relativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

export function NotificationsList({ notifications }: { notifications: NotificationItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const unread = notifications.filter((n) => !n.readAt);

  async function markAll() {
    setBusy(true);
    await fetch("/api/notifications", { method: "PATCH" });
    setBusy(false);
    router.refresh();
  }

  async function markOne(id: string) {
    setBusy(true);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">Notifications</h1>
          <p className="mt-1 text-[14px] text-ink-muted">
            {unread.length > 0 ? `${unread.length} unread` : "You're all caught up"}
          </p>
        </div>
        {unread.length > 0 && (
          <Button variant="outline" size="sm" onClick={markAll} disabled={busy}>
            <CheckCheck className="h-4 w-4" aria-hidden />
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" description="Task assignments, budget warnings, and customer decisions will appear here." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                "flex items-start gap-3 rounded-card border bg-surface p-4",
                n.readAt ? "border-border" : "border-brand/30"
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                  n.readAt ? "bg-ink-faint/40" : "bg-brand"
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium leading-snug text-ink">{n.title}</p>
                {n.body && <p className="mt-0.5 text-[13px] leading-relaxed text-ink-muted">{n.body}</p>}
                <p className="mt-1 text-[12px] text-ink-faint">{relativeTime(n.createdAt)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {n.link && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[13px] font-medium text-brand hover:text-brand-hover"
                    onClick={() => {
                      const link = n.link as string;
                      if (!n.readAt) markOne(n.id);
                      window.location.href = link;
                    }}
                  >
                    View
                  </Button>
                )}
                {!n.readAt && (
                  <Button variant="ghost" size="icon-sm" onClick={() => markOne(n.id)} disabled={busy} aria-label="Mark as read">
                    <Check className="h-4 w-4" aria-hidden />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}