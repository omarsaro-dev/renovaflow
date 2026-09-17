"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Menu, X, Home, FolderKanban, BadgeDollarSign, FileCheck2, Images, MessageSquareText } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "../shared/logo";
import { NotificationBell } from "../shared/notification-bell";
import { Avatar } from "../ui/avatar";

const CUSTOMER_NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/portal", label: "My projects", icon: Home },
  { href: "/portal/updates", label: "Updates", icon: MessageSquareText },
  { href: "/portal/budget", label: "Budget & costs", icon: BadgeDollarSign },
  { href: "/portal/approvals", label: "Approvals", icon: FileCheck2 },
  { href: "/portal/files", label: "Photos & files", icon: Images },
  { href: "/portal/profile", label: "Profile", icon: FolderKanban },
];

export function CustomerShell({
  user,
  organizationName,
  children,
}: {
  user: { id: string; name: string; email: string; avatarUrl?: string | null };
  organizationName: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => setMobileOpen(false), [pathname]);

  function isActive(href: string) {
    if (href === "/portal") return pathname === "/portal" || pathname === "/portal/projects";
    return pathname?.startsWith(href) ?? false;
  }

  const nav = (
    <nav aria-label="Customer menu" className="space-y-0.5">
      {CUSTOMER_NAV.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-control px-3 py-2 text-[14px] font-medium transition-colors",
              active ? "bg-brandTint text-brand" : "text-ink-muted hover:bg-elevated hover:text-ink"
            )}
          >
            <item.icon className={cn("h-[18px] w-[18px]", active ? "text-brand" : "text-ink-faint")} aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-surface lg:flex">
        <div className="px-5 py-5">
          <Link href="/portal">
            <Logo />
          </Link>
        </div>
        <div className="px-4">
          <p className="rounded-control border border-border bg-elevated px-3 py-2 text-[13px] text-ink-muted">
            <span className="font-semibold text-ink">{organizationName}</span>
            <span className="block text-[12px]">Customer portal</span>
          </p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">{nav}</div>
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} src={user.avatarUrl} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-ink">{user.name}</p>
              <p className="truncate text-[12px] text-ink-muted">{user.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-control p-2 text-ink-muted transition-colors hover:bg-dangerTint hover:text-danger"
              aria-label="Sign out"
            >
              <LogOut className="h-[18px] w-[18px]" aria-hidden />
            </button>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-control border border-border p-2 text-ink-muted hover:bg-elevated"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
        <Logo />
        <NotificationBell portal="/portal" />
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-[#22291f]/40 backdrop-blur-[2px]" onClick={() => setMobileOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-surface shadow-elevated">
            <div className="flex items-center justify-between px-5 py-5">
              <Logo />
              <button onClick={() => setMobileOpen(false)} className="rounded-control p-2 text-ink-muted hover:bg-elevated" aria-label="Close menu">
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">{nav}</div>
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <div className="mx-auto max-w-[960px] px-4 py-6 sm:px-6 lg:py-10">{children}</div>
      </div>
    </div>
  );
}